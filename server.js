import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dns from 'dns';

dns.setServers(["1.1.1.1","8.8.8.8"]);

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://dermasis-remedies-product-vizulate.vercel.app'
  ],
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  credentials: true
}));

// ─── Schemas ────────────────────────────────────────────────────────────────

// product_vizulate collection (for the Product Visualizer frontend)
const VizulateSchema = new mongoose.Schema({
    _id: String,
    name: String,
    link: String
}, { collection: 'product_vizulate' });

const ProductVizulate = mongoose.model('ProductVizulate', VizulateSchema);

// Doctor_List collection
const DoctorProductSchema = new mongoose.Schema({
  id:   { type: String, required: true },
  name: { type: String, required: true },
  link: { type: String, required: true },
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  phone:         { type: String, required: true },
  state:         { type: String, required: true },
  city:          { type: String, required: true },
  subLocality:   { type: String, required: '' },
  email:         { type: String, default: '' },
  degreeType:    { type: String, required: true },
  specialization:{ type: String, default: true },
  grade:         { type: String, required: true },
  visitDay:      { type: String, default: '' },
  products:      { type: [DoctorProductSchema], default: [] },
}, { collection: 'Doctor_List' });

const Doctor = mongoose.model('Doctor', DoctorSchema);

// ─── DB Connection ───────────────────────────────────────────────────────────

const url = process.env.MONGODB_URI;

mongoose.connect(url)
    .then(async () => {
      console.log("✅ Database Connected Successfully");
      // Ensure indexes on frequently queried fields
      try {
        await Doctor.collection.createIndex({ name: 1 });
        await Doctor.collection.createIndex({ city: 1 });
        await Doctor.collection.createIndex({ state: 1 });
        await Doctor.collection.createIndex({ grade: 1 });
        console.log("✅ Database indexes ensured");
      } catch (idxErr) {
        console.warn("⚠️ Index creation warning:", idxErr.message);
      }
    })
    .catch((err) => {
        console.error("❌ Database Connection Error Details:");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Full Error:", err);
    });

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
let productCache = null;
let productCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Product Vizulate Routes ─────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
    try {
        const { category, subCategory } = req.query;
        let query = {};
        if (category) query.category = category;
        if (subCategory) query.Category_sub = subCategory;
        const products = await ProductVizulate.find(query);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Product Vizulate endpoint WITH SORTING by name ascending + in-memory cache
app.get('/api/vizulate-products', async (req, res) => {
    try {
        const now = Date.now();
        if (productCache && (now - productCacheTime) < CACHE_TTL_MS) {
          return res.status(200).json(productCache);
        }
        const products = await ProductVizulate.find({}).sort({ name: 1 });
        productCache = products;
        productCacheTime = now;
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching vizulate products:", error);
        res.status(500).json({ error: 'Failed to fetch vizulate products' });
    }
});

// ─── Doctor Routes ───────────────────────────────────────────────────────────

// GET  /api/doctors          — all doctors sorted by name asc
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ name: 1 });
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET  /api/doctors/:id      — single doctor with products
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doctors          — create new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const { name, phone, state, city, subLocality, email, degreeType, specialization, grade, visitDay, defaultProduct } = req.body;

    const products = [];
    if (defaultProduct && defaultProduct.id && defaultProduct.name && defaultProduct.link) {
      products.push({
        id:   defaultProduct.id,
        name: defaultProduct.name,
        link: defaultProduct.link,
      });
    }

    const doctor = new Doctor({ name, phone, state, city, subLocality, email: email || '', degreeType, specialization: specialization || '', grade, visitDay: visitDay || '', products });
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/doctors/:id  — update doctor profile fields
app.put('/api/doctors/:id', async (req, res) => {
  try {
    const { name, phone, state, city, subLocality, email, degreeType, specialization, grade, visitDay } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { name, phone, state, city, subLocality, email, degreeType, specialization, grade, visitDay },
      { new: true, runValidators: true }
    );
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.status(200).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/doctors/:id    — delete a doctor entirely
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const deleted = await Doctor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Doctor not found' });
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/doctors/:id/products          — add a product to doctor
app.patch('/api/doctors/:id/products', async (req, res) => {
  try {
    const { id, name, link } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Avoid duplicate product
    const alreadyExists = doctor.products.some(p => p.id === id);
    if (alreadyExists) return res.status(409).json({ error: 'Product already linked to this doctor' });

    doctor.products.push({ id, name, link });
    await doctor.save();
    res.status(200).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/doctors/:id/products/:productId  — remove a product from doctor
app.delete('/api/doctors/:id/products/:productId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    doctor.products = doctor.products.filter(p => p.id !== req.params.productId);
    await doctor.save();
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/doctors/:id/products/reorder  — reorder linked products
app.put('/api/doctors/:id/products/reorder', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'products must be an array' });

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    doctor.products = [];
    products.forEach(p => doctor.products.push({ id: p.id, name: p.name, link: p.link }));
    doctor.markModified('products');
    await doctor.save();
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json({
    message: "Product Dermasis Backend API is running successfully!",
    status: "Healthy"
  });
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));