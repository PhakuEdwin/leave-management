import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from './trpc';
import { login, hashPassword } from './auth';
import db from './db';

const authRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(({ input }) => {
      const result = login(input.username, input.password);
      if (!result) throw new Error('Invalid username or password');
      return result;
    }),

  me: protectedProcedure.query(({ ctx }) => {
    const user = db.prepare('SELECT id, username, firstName, lastName, preferredName, employeeTitle, role, leaveBalance FROM users WHERE id = ?').get(ctx.user.id) as any;
    return user;
  }),
});

const leaveRouter = router({
  // Submit a leave request
  create: protectedProcedure
    .input(z.object({
      leaveType: z.enum(['Normal Leave', 'Study / Exam Leave', 'Family Responsibility']),
      startDate: z.string(),
      endDate: z.string(),
      totalDays: z.number().min(1),
      reason: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      // Check leave balance for Normal Leave
      if (input.leaveType === 'Normal Leave') {
        const user = db.prepare('SELECT leaveBalance FROM users WHERE id = ?').get(ctx.user.id) as any;
        if (user.leaveBalance < input.totalDays) {
          throw new Error(`Insufficient leave balance. You have ${user.leaveBalance} days remaining.`);
        }
      }

      const result = db.prepare(`
        INSERT INTO leave_requests (userId, leaveType, startDate, endDate, totalDays, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ctx.user.id, input.leaveType, input.startDate, input.endDate, input.totalDays, input.reason || '');

      return { id: result.lastInsertRowid };
    }),

  // Get my leave requests
  myRequests: protectedProcedure
    .input(z.object({ year: z.number().optional() }).optional())
    .query(({ ctx, input }) => {
      const year = input?.year || new Date().getFullYear();
      const requests = db.prepare(`
        SELECT lr.*, u.firstName as processedByFirstName, u.lastName as processedByLastName
        FROM leave_requests lr
        LEFT JOIN users u ON lr.processedBy = u.id
        WHERE lr.userId = ? AND strftime('%Y', lr.startDate) = ?
        ORDER BY lr.createdAt DESC
      `).all(ctx.user.id, String(year));
      return requests;
    }),

  // Get all leave requests (admin)
  all: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'declined', 'all']).optional(),
      year: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      const status = input?.status || 'all';
      const year = input?.year || new Date().getFullYear();
      let query = `
        SELECT lr.*, u.firstName, u.lastName, u.preferredName, u.employeeTitle,
               p.firstName as processedByFirstName, p.lastName as processedByLastName
        FROM leave_requests lr
        JOIN users u ON lr.userId = u.id
        LEFT JOIN users p ON lr.processedBy = p.id
        WHERE strftime('%Y', lr.startDate) = ?
      `;
      const params: any[] = [String(year)];

      if (status !== 'all') {
        query += ' AND lr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY lr.createdAt DESC';
      return db.prepare(query).all(...params);
    }),

  // Approve/decline a leave request (admin)
  process: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['approved', 'declined']),
      declineReason: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const request = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(input.id) as any;
      if (!request) throw new Error('Leave request not found');
      if (request.status !== 'pending') throw new Error('Request already processed');

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE leave_requests
        SET status = ?, processedBy = ?, processedAt = ?, declineReason = ?, updatedAt = ?
        WHERE id = ?
      `).run(input.status, ctx.user.id, now, input.declineReason || '', now, input.id);

      // Deduct leave balance if approved and it's Normal Leave
      if (input.status === 'approved' && request.leaveType === 'Normal Leave') {
        db.prepare('UPDATE users SET leaveBalance = leaveBalance - ? WHERE id = ?')
          .run(request.totalDays, request.userId);
      }

      return { success: true };
    }),

  // Calendar data - approved leaves
  calendar: protectedProcedure
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
    }))
    .query(({ input }) => {
      const startOfMonth = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
      const endOfMonth = input.month === 12
        ? `${input.year + 1}-01-01`
        : `${input.year}-${String(input.month + 1).padStart(2, '0')}-01`;

      const leaves = db.prepare(`
        SELECT lr.*, u.firstName, u.lastName, u.preferredName
        FROM leave_requests lr
        JOIN users u ON lr.userId = u.id
        WHERE lr.status = 'approved'
          AND lr.startDate < ? AND lr.endDate >= ?
        ORDER BY lr.startDate
      `).all(endOfMonth, startOfMonth);

      return leaves;
    }),

  // Pending count for admin badge
  pendingCount: adminProcedure.query(() => {
    const result = db.prepare('SELECT COUNT(*) as count FROM leave_requests WHERE status = ?').get('pending') as any;
    return result.count;
  }),
});

const userRouter = router({
  // List all staff (admin)
  list: adminProcedure.query(() => {
    return db.prepare('SELECT id, username, firstName, lastName, preferredName, employeeTitle, role, leaveBalance, createdAt FROM users ORDER BY firstName').all();
  }),

  // Create staff member (admin)
  create: adminProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(4),
      firstName: z.string(),
      lastName: z.string(),
      preferredName: z.string().optional(),
      employeeTitle: z.string().optional(),
      role: z.enum(['admin', 'staff']).optional(),
      leaveBalance: z.number().optional(),
    }))
    .mutation(({ input }) => {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(input.username);
      if (existing) throw new Error('Username already exists');

      const hashed = hashPassword(input.password);
      const result = db.prepare(`
        INSERT INTO users (username, password, firstName, lastName, preferredName, employeeTitle, role, leaveBalance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.username, hashed, input.firstName, input.lastName,
        input.preferredName || '', input.employeeTitle || '',
        input.role || 'staff', input.leaveBalance ?? 21
      );

      return { id: result.lastInsertRowid };
    }),

  // Update staff member (admin)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      preferredName: z.string().optional(),
      employeeTitle: z.string().optional(),
      role: z.enum(['admin', 'staff']).optional(),
      leaveBalance: z.number().optional(),
      password: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, password, ...fields } = input;
      const updates: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (password) {
        updates.push('password = ?');
        values.push(hashPassword(password));
      }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')");
        values.push(id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      return { success: true };
    }),

  // Delete staff member (admin)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (input.id === ctx.user.id) throw new Error('Cannot delete your own account');
      db.prepare('DELETE FROM leave_requests WHERE userId = ?').run(input.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(input.id);
      return { success: true };
    }),
});

export const appRouter = router({
  auth: authRouter,
  leave: leaveRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
