import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dns from 'dns';

dns.setServers(["1.1.1.1","8.8.8.8"]);

const app = express();
app.use(express.json());
app.use(cors());



// product_vizulate collection (for the Product Visualizer frontend)
const VizulateSchema = new mongoose.Schema({
    _id: String,
    name: String,
    link: String
}, { collection: 'product_vizulate' });

const ProductVizulate = mongoose.model('ProductVizulate', VizulateSchema);

// Connect to your Database (Modified to use Dermasis database specifically)
const url = process.env.MONGODB_URI || "mongodb+srv://Dev_letwala_Softcap:Dev_mongodb0716@softcapdev.puzklaw.mongodb.net/Dermasis?appName=SoftcapDev";

mongoose.connect(url)
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((err) => {
        console.error("❌ Database Connection Error Details:");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Full Error:", err);
    });



app.get('/api/products', async (req, res) => {
    try {
        const { category, subCategory } = req.query;
        let query = {};
        if (category) query.category = category;
        if (subCategory) query.Category_sub = subCategory;
        const products = await ProductList.find(query);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Product Vizulate endpoint WITH SORTING by name ascending
app.get('/api/vizulate-products', async (req, res) => {
    try {
        const products = await ProductVizulate.find({}).sort({ name: 1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching vizulate products:", error);
        res.status(500).json({ error: 'Failed to fetch vizulate products' });
    }
});

// Add this to your server.js
app.get('/', (req, res) => {
  res.send('Product Dermasis Backend Server is running successfully!');
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));