const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAdmin, requireAdminOrManager, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all payments with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      user_id, 
      status = '',
      payment_method = '',
      start_date,
      end_date,
      min_amount,
      max_amount,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = db('payments')
      .select(
        'payments.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'battery_rentals.id as rental_id'
      )
      .leftJoin('users', 'payments.user_id', 'users.id')
      .leftJoin('battery_rentals', 'payments.rental_id', 'battery_rentals.id')
      .orderBy(`payments.${sort_by}`, sort_order);

    // Filter by user if customer
    if (req.user.role === 'customer') {
      query = query.where('payments.user_id', req.user.userId);
    } else if (user_id) {
      query = query.where('payments.user_id', user_id);
    }

    // Status filter
    if (status) {
      query = query.where('payments.status', status);
    }

    // Payment method filter
    if (payment_method) {
      query = query.where('payments.payment_method', payment_method);
    }

    // Date range filter
    if (start_date) {
      query = query.where('payments.created_at', '>=', start_date);
    }
    if (end_date) {
      query = query.where('payments.created_at', '<=', end_date);
    }

    // Amount range filter
    if (min_amount) {
      query = query.where('payments.amount', '>=', parseFloat(min_amount));
    }
    if (max_amount) {
      query = query.where('payments.amount', '<=', parseFloat(max_amount));
    }

    const payments = await query.limit(parseInt(limit)).offset(offset);
    
    // Get total count for pagination
    let countQuery = db('payments');
    if (req.user.role === 'customer') {
      countQuery = countQuery.where('user_id', req.user.userId);
    } else if (user_id) {
      countQuery = countQuery.where('user_id', user_id);
    }
    if (status) countQuery = countQuery.where('status', status);
    if (payment_method) countQuery = countQuery.where('payment_method', payment_method);
    if (start_date) countQuery = countQuery.where('created_at', '>=', start_date);
    if (end_date) countQuery = countQuery.where('created_at', '<=', end_date);
    if (min_amount) countQuery = countQuery.where('amount', '>=', parseFloat(min_amount));
    if (max_amount) countQuery = countQuery.where('amount', '<=', parseFloat(max_amount));
    
    const totalCount = await countQuery.count('id as count').first();

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await db('payments')
      .select(
        'payments.*',
        'users.full_name as user_name',
        'users.email as user_email',
        'users.phone as user_phone',
        'battery_rentals.start_time as rental_start_time',
        'battery_rentals.end_time as rental_end_time'
      )
      .leftJoin('users', 'payments.user_id', 'users.id')
      .leftJoin('battery_rentals', 'payments.rental_id', 'battery_rentals.id')
      .where('payments.id', id)
      .first();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check ownership if customer
    if (req.user.role === 'customer' && payment.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ payment });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('payment_method').isIn(['mpesa', 'card', 'cash', 'points', 'bank_transfer']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      user_id,
      rental_id,
      amount,
      currency = 'KES',
      payment_method,
      payment_reference,
      mpesa_receipt_number,
      description,
      metadata
    } = req.body;

    // Verify user exists
    const user = await db('users').where({ id: user_id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If rental_id provided, verify it exists
    if (rental_id) {
      const rental = await db('battery_rentals').where({ id: rental_id }).first();
      if (!rental) {
        return res.status(404).json({ error: 'Rental not found' });
      }
    }

    const paymentData = {
      user_id,
      rental_id: rental_id || null,
      amount: parseFloat(amount),
      currency,
      payment_method,
      payment_reference,
      mpesa_receipt_number,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'pending'
    };

    const [paymentId] = await db('payments').insert(paymentData);
    
    const payment = await db('payments')
      .select(
        'payments.*',
        'users.full_name as user_name'
      )
      .leftJoin('users', 'payments.user_id', 'users.id')
      .where('payments.id', paymentId)
      .first();

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('payment-created', payment);

    res.status(201).json({
      message: 'Payment created successfully',
      payment
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment status
router.patch('/:id/status', requireAdminOrManager, [
  body('status').isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, processed_by } = req.body;

    const payment = await db('payments').where({ id }).first();
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updateData = {
      status,
      updated_at: new Date()
    };

    if (status === 'completed' || status === 'failed') {
      updateData.processed_at = new Date();
    }

    if (notes) updateData.description = notes;
    if (processed_by) updateData.processed_by = processed_by;

    await db('payments').where({ id }).update(updateData);

    // If payment is for a rental and status is completed, update rental payment status
    if (payment.rental_id && status === 'completed') {
      await db('battery_rentals')
        .where({ id: payment.rental_id })
        .update({ payment_status: 'completed' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('payment-status-updated', { id, status });

    res.json({ 
      message: `Payment status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Process refund
router.post('/:id/refund', requireAdminOrManager, [
  body('refund_amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, reason, refund_method = 'original' } = req.body;

    const payment = await db('payments').where({ id }).first();
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    const refundAmountFinal = refund_amount || payment.amount;
    
    if (refundAmountFinal > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed original payment amount' });
    }

    const trx = await db.transaction();

    try {
      // Create refund record (as a negative payment)
      const [refundId] = await trx('payments').insert({
        user_id: payment.user_id,
        rental_id: payment.rental_id,
        amount: -refundAmountFinal,
        currency: payment.currency,
        payment_method: refund_method,
        payment_reference: `REFUND-${payment.payment_reference || id}`,
        description: `Refund for payment ${id}: ${reason}`,
        status: 'completed',
        processed_at: new Date(),
        metadata: JSON.stringify({
          original_payment_id: id,
          refund_reason: reason,
          processed_by: req.user.userId
        })
      });

      // Update original payment status
      await trx('payments').where({ id }).update({
        status: 'refunded',
        updated_at: new Date(),
        description: payment.description + ` | REFUNDED: ${reason}`
      });

      await trx.commit();

      // Emit real-time update
      const io = req.app.get('io');
      io.to('admin-room').emit('payment-refunded', { id, refund_id: refundId, amount: refundAmountFinal });

      res.json({
        message: 'Refund processed successfully',
        refund_id: refundId,
        refund_amount: refundAmountFinal
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Bulk update payments
router.patch('/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { payment_ids, update_data } = req.body;

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({ error: 'Payment IDs array is required' });
    }

    if (!update_data || typeof update_data !== 'object') {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const allowedFields = ['status'];
    const filteredUpdateData = {};
    
    Object.keys(update_data).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = update_data[key];
      }
    });

    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    filteredUpdateData.updated_at = new Date();
    if (filteredUpdateData.status === 'completed' || filteredUpdateData.status === 'failed') {
      filteredUpdateData.processed_at = new Date();
    }

    const updatedCount = await db('payments')
      .whereIn('id', payment_ids)
      .update(filteredUpdateData);

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('payments-bulk-updated', { payment_ids, update_data: filteredUpdateData });

    res.json({ 
      message: `${updatedCount} payments updated successfully`,
      updated_count: updatedCount
    });

  } catch (error) {
    console.error('Bulk update payments error:', error);
    res.status(500).json({ error: 'Failed to bulk update payments' });
  }
});

// Get payment statistics
router.get('/stats/overview', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await Promise.all([
      // Total payments
      db('payments').count('id as count').first(),
      // Completed payments
      db('payments').where('status', 'completed').count('id as count').first(),
      // Pending payments
      db('payments').where('status', 'pending').count('id as count').first(),
      // Failed payments
      db('payments').where('status', 'failed').count('id as count').first(),
      // Total revenue (completed payments)
      db('payments').where('status', 'completed').sum('amount as total').first(),
      // Revenue in period
      db('payments').where('status', 'completed').where('created_at', '>=', startDate).sum('amount as total').first(),
      // Payments by method
      db('payments').where('status', 'completed').select('payment_method').count('id as count').sum('amount as total').groupBy('payment_method'),
      // Average transaction value
      db('payments').where('status', 'completed').avg('amount as avg').first()
    ]);

    const paymentMethodStats = {};
    stats[6].forEach(method => {
      paymentMethodStats[method.payment_method] = {
        count: method.count,
        total: method.total || 0
      };
    });

    res.json({
      totalPayments: stats[0].count,
      completedPayments: stats[1].count,
      pendingPayments: stats[2].count,
      failedPayments: stats[3].count,
      totalRevenue: stats[4].total || 0,
      revenueInPeriod: stats[5].total || 0,
      paymentMethodStats,
      averageTransactionValue: stats[7].avg || 0,
      period
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', requireAdminOrManager, async (req, res) => {
  try {
    const { period = '30d', group_by = 'day' } = req.query;
    
    let startDate;
    let dateFormat;
    
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = group_by === 'week' ? '%Y-%u' : '%Y-%m-%d';
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%u'; // Week
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m'; // Month
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
    }

    const revenueData = await db('payments')
      .select(
        db.raw(`DATE_FORMAT(created_at, '${dateFormat}') as period`),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as transactions')
      )
      .where('status', 'completed')
      .where('created_at', '>=', startDate)
      .groupBy('period')
      .orderBy('period', 'asc');

    res.json({
      period,
      group_by,
      data: revenueData
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Export payments data
router.get('/export/csv', requireAdminOrManager, async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;

    let query = db('payments')
      .select(
        'payments.id',
        'payments.amount',
        'payments.currency',
        'payments.payment_method',
        'payments.status',
        'payments.created_at',
        'payments.processed_at',
        'users.full_name as user_name',
        'users.email as user_email'
      )
      .leftJoin('users', 'payments.user_id', 'users.id')
      .orderBy('payments.created_at', 'desc');

    if (start_date) {
      query = query.where('payments.created_at', '>=', start_date);
    }
    if (end_date) {
      query = query.where('payments.created_at', '<=', end_date);
    }
    if (status) {
      query = query.where('payments.status', status);
    }

    const payments = await query;

    // Convert to CSV format
    const headers = ['ID', 'Amount', 'Currency', 'Payment Method', 'Status', 'Created At', 'Processed At', 'User Name', 'User Email'];
    const csvData = [headers];
    
    payments.forEach(payment => {
      csvData.push([
        payment.id,
        payment.amount,
        payment.currency,
        payment.payment_method,
        payment.status,
        payment.created_at,
        payment.processed_at || '',
        payment.user_name,
        payment.user_email
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({ error: 'Failed to export payments data' });
  }
});

module.exports = router;