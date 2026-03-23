const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== FIREBASE (Firestore) ====================
// Use the service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
console.log('Connected to Firestore');

// ==================== FIRESTORE COLLECTION REFS ====================
const usersRef = firestore.collection('users');
const ordersRef = firestore.collection('orders');
const productsRef = firestore.collection('products');

// ==================== MIDDLEWARE ====================
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// ==================== ENSURE DEFAULT ADMIN ====================
async function ensureDefaultAdmin() {
    try {
        const snap = await usersRef.where('email', '==', 'admin@sparkles.com').limit(1).get();
        if (snap.empty) {
            await usersRef.add({
                name: 'Administrator',
                email: 'admin@sparkles.com',
                phone: '0759102078',
                password: 'admin123',
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Default admin created in Firestore: admin@sparkles.com / admin123');
        }
    } catch (e) {
        console.error('Failed to ensure default admin:', e.message);
    }
}

// ==================== API ROUTES ====================
// ... Keep all your /api routes exactly as you wrote them

// ==================== SEED PRODUCTS ====================
async function seedProductsIfEmpty() {
    const snap = await productsRef.limit(1).get();
    if (!snap.empty) return;
    const defaults = [
        { name: "Liquid Laundry", price: 600, image: "https://placehold.co/400x600/3b82f6/ffffff?text=Laundry", desc: "Powerful stain removal for all fabrics. Gentle on hands, tough on dirt. 5 Litres.", category: "Laundry", stock: 100 },
        { name: "Hair Shampoo", price: 699, image: "https://placehold.co/400x600/10b981/ffffff?text=Shampoo", desc: "Nourishing formula for silky smooth hair. Contains natural extracts. 5 Litres.", category: "Personal Care", stock: 80 },
        { name: "Shower Gel", price: 749, image: "https://placehold.co/400x600/0ea5e9/ffffff?text=Shower+Gel", desc: "Refreshing and moisturizing body wash. Long lasting fragrance. 5 Litres.", category: "Personal Care", stock: 75 },
        { name: "Multi-purpose Detergent", price: 549, image: "https://placehold.co/400x600/f59e0b/ffffff?text=Multi+Purpose", desc: "All surface cleaner for floors, tiles, and kitchen tops. 5 Litres.", category: "Household", stock: 90 },
        { name: "Dish Washing Liquid", price: 449, image: "https://placehold.co/400x600/ef4444/ffffff?text=Dish+Wash", desc: "Cuts through grease instantly. Lemon fresh scent. 5 Litres.", category: "Kitchen", stock: 120 },
        { name: "Bleach", price: 499, image: "https://placehold.co/400x600/6366f1/ffffff?text=Bleach", desc: "Strong whitening and disinfecting action. 5 Litres.", category: "Laundry", stock: 85 },
        { name: "Fabric Softener", price: 900, image: "https://placehold.co/400x600/ec4899/ffffff?text=Softener", desc: "Leaves clothes soft, fluffy, and smelling amazing. 5 Litres.", category: "Laundry", stock: 70 }
    ];
    for (let i = 0; i < defaults.length; i++) {
        await productsRef.doc(String(i + 1)).set({ ...defaults[i], id: i + 1 });
    }
    console.log('Seeded default products');
}

// ==================== START SERVER ====================
seedProductsIfEmpty().catch(console.error);
ensureDefaultAdmin().catch(console.error);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend served from: ${frontendPath}`);
    console.log(`Admin: http://localhost:${PORT}/admin.html`);
});