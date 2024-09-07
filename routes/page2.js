app.get('/load/page2', async (req, res) => {
    try {
        // Fetch all records with status "open"
        const openServices = await ServiceRecord.find({ status: 'open' });
        console.log("Open services data fetched:", openServices);
        res.render('partials/page2', { openServices }); // Pass the open services data to the template
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
