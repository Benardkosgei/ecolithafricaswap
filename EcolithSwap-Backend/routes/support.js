const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all support tickets
router.get('/', async (req, res) => {
    const tickets = await db('support_tickets').select('*');
    res.json(tickets);
});

// Create a new support ticket
router.post('/', async (req, res) => {
    const { user_id, subject, message } = req.body;
    const newTicket = await db('support_tickets').insert({ user_id, subject, message }).returning('*');
    res.status(201).json(newTicket[0]);
});

// Get a single support ticket by ID
router.get('/:id', async (req, res) => {
    const ticket = await db('support_tickets').where({ id: req.params.id }).first();
    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// Update a support ticket
router.put('/:id', async (req, res) => {
    const { status } = req.body;
    const updatedTicket = await db('support_tickets').where({ id: req.params.id }).update({ status }).returning('*');
    res.json(updatedTicket[0]);
});

module.exports = router;