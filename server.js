const express = require('express');
const app = express();
const ejs = require('ejs');
const notifier = require('node-notifier');
const session = require('express-session');
const mongoose = require("mongoose");
const router = express.Router();
//const ServiceRecord = require('servicerecords'); // Assuming you have this model
const routing = require('./routes/routes');

const ServiceRecord = require('./models/ServiceRecord'); // Import the model


app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Configure express-session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

//-----------------***------------------

mongoose.connect('mongodb://127.0.0.1:27017/mydbase');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("connected to MongoDB");
});



//---------------***-------------------

app.get('/', (req, res) => {
    res.render('login.ejs');
});



//-----------------***------------------

app.post("/redirect", async (req, res) => {
    const LogInSchema = new mongoose.Schema({
        name: { type: String, required: true },
        password: { type: String, required: true },
        email: { type: String, required: true },
        phoneNr: { type: String, required: true }
    });

    const collection = new mongoose.model("logTable", LogInSchema);
    let errorOccurred = false;

    try {
        const check = await collection.findOne({ name: req.body.username });
        if (req.body.username == "admin" && req.body.password == "admin") {
            res.render("./admin_page.ejs");
        } else {
            if (check.password === req.body.password && check.name === req.body.username) {
                const user = req.body.username;
                res.render("./user_page.ejs", { user: user });
            } else {
                notifier.notify({
                    title: "Error",
                    message: "Invalid Password"
                });
                errorOccurred = true;
            }
        }
    } catch {
        notifier.notify({
            title: "Error",
            message: "Invalid Username"
        });
        errorOccurred = true;
    }

    if (errorOccurred) {
        res.render("login.ejs");
    }
});



//-----------------***------------------

app.get('/service', (req, res) => {
    res.render('service'); // Render the service.ejs file
});

//----------------***------------------

app.get('/load/:page', (req, res) => {
    const page = req.params.page;
    res.render(`partials/${page}`);
});


//-----------------***------------------

app.get('/addServiceRecord', (req, res) => {
    res.render('addServiceRecord');
});



//-----------------***------------------


// Handle form submission and add the service record to MongoDB
app.post('/addServiceRecord', async (req, res) => {
    try {
        const ServiceRecordSchema = new mongoose.Schema({
            service_id: { type: Number, required: true },
            username: { type: String, required: true },
            datetime: { type: Date, required: true, default: Date.now },
            customer_name: { type: String, required: true },
            contact_number: { type: String, required: true },
            email_id: { type: String, required: true },
            phone_company: { type: String, required: true },
            model: { type: String, required: true },
            nature_of_fault: { type: String, required: true },
            estimate_cost: { type: String, required: true },
            sim_handled: { type: Boolean, default: false },
            sim_tray_handled: { type: Boolean, default: false },
            memory_card_available: { type: Boolean, default: false },
            battery_available: { type: Boolean, default: false },
            pouch_available: { type: Boolean, default: false },
            status:{type:String, default: 'open'}
        });
  
        const ServiceRecord = mongoose.model('ServiceRecord', ServiceRecordSchema);
  
        // Check if the model already exists before defining it
        //const ServiceRecord = mongoose.models.ServiceRecord || mongoose.model('ServiceRecord', serviceRecordSchema);
        //module.exports = ServiceRecord;
        // Count the documents asynchronously
        const count = await ServiceRecord.countDocuments();
  
        const service_id = count + 1;
        const newServiceRecord = new ServiceRecord({
            service_id: service_id,
            username: req.session.user || 'guest',
            customer_name: req.body.customerName,
            contact_number: req.body.contactNumber,
            email_id: req.body.emailId,
            phone_company: req.body.phoneCompany,
            model: req.body.phoneModel,
            nature_of_fault: req.body.natureOfFault,
            estimate_cost: req.body.estimateCost,
            sim_handled: req.body.simHandled === 'on',
            sim_tray_handled: req.body.simTrayHandled === 'on',
            memory_card_available: req.body.memoryCardAvailable === 'on',
            battery_available: req.body.batteryAvailable === 'on',
            pouch_available: req.body.pouchAvailable === 'on'
        });
  
        await newServiceRecord.save();
  
        // Render the receipt HTML
        res.render('partials/receipt', {
            service_id: service_id,
            customer_name: req.body.customerName,
            model: req.body.phoneModel
        });
  
    } catch (err) {
        console.error("Error processing request:", err);
        res.status(500).send("Error processing request");
    }
  });

  
  //-----------------***------------------


// Route to get all service IDs with open status
router.get('/services/open', async (req, res) => {
    try {
        const openServices = await ServiceRecord.find({ status: 'open' }, 'serviceId'); // Fetch only serviceId
        res.render('openServices', { services: openServices });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// Route to get details of a specific service by ID
router.get('/services/:id', async (req, res) => {
    try {
        const service = await ServiceRecord.findOne({ serviceId: req.params.id });
        if (!service) {
            return res.status(404).send('Service not found');
        }
        res.render('serviceDetails', { service });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to update service details
router.post('/services/:id/edit', async (req, res) => {
    try {
        const { details, amount } = req.body;
        const service = await ServiceRecord.findOneAndUpdate(
            { serviceId: req.params.id },
            { details, amount },
            { new: true }
        );
        if (!service) {
            return res.status(404).send('Service not found');
        }
        res.redirect(`/services/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


//-------***------------

// Express route to load the 'Edit Service' page with open records
router.get('/load/page2', async (req, res) => {
    try {
        // Fetch all records with status "open"
        const openServices = await ServiceRecord.find({ status: 'open' });
        console.log("Data Fetched")
        res.render('partials/page2', { openServices }); // Pass the data to the page2 partial
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



function loadContent(page) {
    fetch('/load/' + page)
        .then(response => response.text())
        .then(html => {
            document.getElementById('content-area').innerHTML = html;
        })
        .catch(err => {
            console.error('Error loading content:', err);
        });
}






//------------------***------------------


app.listen(3000, () => {
    console.log('Server running on port 3000');
});
