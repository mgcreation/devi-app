const mongoose = require('mongoose');

const ServiceRecordSchema = new mongoose.Schema({
    service_id: { type: Number, required: true },
    customer_name: { type: String, required: true },
    contact_number: { type: String, required: true },
    email_id: { type: String, required: true },
    phone_company: { type: String, required: true },
    model: { type: String, required: true },
    nature_of_fault: { type: String, required: true },
    status: { type: String, default: 'open' }
});

const ServiceRecord = mongoose.model('ServiceRecord', ServiceRecordSchema);

module.exports = ServiceRecord;
