require('dotenv').config({ path: '../.env.example' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');

/**
 * Seeds the database with initial data for development and demo purposes.
 * Run: cd server && node utils/seedData.js
 */
async function seedDatabase() {
  try {
    await connectDB();
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
    ]);

    /* ---- Users ---- */
    console.log('Seeding users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@innoventory.com',
      password: 'admin123',
      role: 'admin',
      phone: '9876543210',
    });
    const manager = await User.create({
      name: 'Raj Manager',
      email: 'manager@innoventory.com',
      password: 'manager123',
      role: 'manager',
      phone: '9876543211',
    });
    await User.create({
      name: 'Staff Member',
      email: 'staff@innoventory.com',
      password: 'staff123',
      role: 'staff',
      phone: '9876543212',
    });

    /* ---- Categories ---- */
    console.log('Seeding categories...');
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Electronic components and devices', color: '#6366f1' },
      { name: 'Office Supplies', description: 'Stationery, paper, and office essentials', color: '#10b981' },
      { name: 'Furniture', description: 'Office and home furniture', color: '#f59e0b' },
      { name: 'Hardware', description: 'Tools, fasteners, and building materials', color: '#ef4444' },
      { name: 'Packaging', description: 'Boxes, tape, and packaging materials', color: '#8b5cf6' },
      { name: 'Safety', description: 'PPE, first aid, and safety equipment', color: '#06b6d4' },
    ]);

    /* ---- Suppliers ---- */
    console.log('Seeding suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'TechParts India Pvt Ltd',
        email: 'sales@techparts.in',
        phone: '9812345678',
        company: 'TechParts India',
        address: { street: '42 Industrial Area', city: 'Pune', state: 'Maharashtra', zipCode: '411001', country: 'India' },
        gstNumber: '27AABCT1234A1Z5',
      },
      {
        name: 'Sharma Office Solutions',
        email: 'info@sharmasolutions.com',
        phone: '9898765432',
        company: 'Sharma Group',
        address: { street: '15 MG Road', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
        gstNumber: '27BBCSS5678B2Z8',
      },
      {
        name: 'Patel Hardware Traders',
        email: 'orders@patelhw.com',
        phone: '9887654321',
        company: 'Patel Traders',
        address: { street: '88 Station Road', city: 'Ahmedabad', state: 'Gujarat', zipCode: '380001', country: 'India' },
        gstNumber: '24AABCP9012C3Z1',
      },
    ]);

    /* ---- Customers ---- */
    console.log('Seeding customers...');
    await Customer.insertMany([
      {
        name: 'Acme Corp India',
        email: 'procurement@acmeindia.com',
        phone: '9765432100',
        company: 'Acme Corporation',
        address: { street: '100 Business Park', city: 'Bengaluru', state: 'Karnataka', zipCode: '560001', country: 'India' },
        gstNumber: '29AABCA1234D4Z2',
        totalOrders: 15,
        totalSpent: 285000,
      },
      {
        name: 'Global IT Services',
        email: 'purchase@globalit.in',
        phone: '9654321098',
        company: 'Global IT',
        address: { street: '55 Tech Park', city: 'Hyderabad', state: 'Telangana', zipCode: '500001', country: 'India' },
        totalOrders: 8,
        totalSpent: 142000,
      },
      {
        name: 'Metro Enterprises',
        email: 'buy@metroent.com',
        phone: '9543210987',
        company: 'Metro Group',
        address: { street: '23 Ring Road', city: 'Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
        totalOrders: 22,
        totalSpent: 467000,
      },
    ]);

    /* ---- Products ---- */
    console.log('Seeding products...');
    await Product.insertMany([
      { name: 'Wireless Mouse', sku: 'ELEC-001', description: 'Ergonomic wireless mouse with USB receiver', category: categories[0]._id, supplier: suppliers[0]._id, costPrice: 350, sellingPrice: 599, quantity: 150, minStockLevel: 25, unit: 'pcs', createdBy: admin._id },
      { name: 'Mechanical Keyboard', sku: 'ELEC-002', description: 'RGB mechanical keyboard with Cherry MX switches', category: categories[0]._id, supplier: suppliers[0]._id, costPrice: 2200, sellingPrice: 3499, quantity: 45, minStockLevel: 10, unit: 'pcs', createdBy: admin._id },
      { name: 'USB-C Hub 7-in-1', sku: 'ELEC-003', description: 'Multi-port USB-C hub with HDMI, USB 3.0, and PD charging', category: categories[0]._id, supplier: suppliers[0]._id, costPrice: 1100, sellingPrice: 1899, quantity: 8, minStockLevel: 15, unit: 'pcs', createdBy: admin._id },
      { name: 'LED Monitor 24"', sku: 'ELEC-004', description: '24-inch Full HD IPS LED monitor', category: categories[0]._id, supplier: suppliers[0]._id, costPrice: 8500, sellingPrice: 12999, quantity: 20, minStockLevel: 5, unit: 'pcs', createdBy: admin._id },
      { name: 'A4 Copier Paper (500 sheets)', sku: 'OFFC-001', description: 'Premium quality 75GSM A4 paper', category: categories[1]._id, supplier: suppliers[1]._id, costPrice: 180, sellingPrice: 285, quantity: 300, minStockLevel: 50, unit: 'pack', createdBy: manager._id },
      { name: 'Ballpoint Pen (Box of 50)', sku: 'OFFC-002', description: 'Blue ink ballpoint pens, box of 50', category: categories[1]._id, supplier: suppliers[1]._id, costPrice: 120, sellingPrice: 199, quantity: 5, minStockLevel: 20, unit: 'box', createdBy: manager._id },
      { name: 'Whiteboard Marker Set', sku: 'OFFC-003', description: 'Set of 4 assorted color whiteboard markers', category: categories[1]._id, supplier: suppliers[1]._id, costPrice: 85, sellingPrice: 149, quantity: 80, minStockLevel: 15, unit: 'pack', createdBy: manager._id },
      { name: 'Executive Office Chair', sku: 'FURN-001', description: 'High-back mesh executive chair with lumbar support', category: categories[2]._id, supplier: suppliers[1]._id, costPrice: 6500, sellingPrice: 9999, quantity: 12, minStockLevel: 3, unit: 'pcs', createdBy: admin._id },
      { name: 'Standing Desk', sku: 'FURN-002', description: 'Electric height-adjustable standing desk, 140cm', category: categories[2]._id, supplier: suppliers[1]._id, costPrice: 15000, sellingPrice: 22999, quantity: 0, minStockLevel: 2, unit: 'pcs', createdBy: admin._id },
      { name: 'Cordless Drill Kit', sku: 'HDWR-001', description: '18V cordless drill with 30-piece bit set', category: categories[3]._id, supplier: suppliers[2]._id, costPrice: 2800, sellingPrice: 4299, quantity: 25, minStockLevel: 5, unit: 'pcs', createdBy: manager._id },
      { name: 'Heavy Duty Tape Gun', sku: 'PACK-001', description: 'Industrial tape dispenser for packaging', category: categories[4]._id, supplier: suppliers[2]._id, costPrice: 450, sellingPrice: 699, quantity: 35, minStockLevel: 10, unit: 'pcs', createdBy: manager._id },
      { name: 'Safety Goggles', sku: 'SAFE-001', description: 'Anti-fog safety goggles with adjustable strap', category: categories[5]._id, supplier: suppliers[2]._id, costPrice: 150, sellingPrice: 249, quantity: 3, minStockLevel: 20, unit: 'pcs', createdBy: admin._id },
    ]);

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login credentials:');
    console.log('  Admin:   admin@innoventory.com   / admin123');
    console.log('  Manager: manager@innoventory.com / manager123');
    console.log('  Staff:   staff@innoventory.com   / staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
