import { Router } from 'express';
import { BackupController } from './backup.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '../users/user.model';

const router = Router();

// Admin Endpoints
router.post('/admin/backups/generate', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.AGENT), BackupController.generateBackup);
router.get('/admin/backups', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.AGENT), BackupController.getBackups);
router.get('/admin/backups/:id/download', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.AGENT), BackupController.downloadBackup);
router.post('/admin/archives/:id/execute', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.AGENT), BackupController.executeMonthlyArchive);

// Restaurant Owner Data Portal Endpoints
router.get('/data/summary', authenticate, requireTenant, BackupController.getDataSummary);
router.post('/data/historical/upload', authenticate, requireTenant, BackupController.uploadAndPreviewBackup);
router.post('/data/historical/import', authenticate, requireTenant, BackupController.importHistoricalData);
router.get('/data/historical/months', authenticate, requireTenant, BackupController.getHistoricalMonths);
router.get('/data/historical/details', authenticate, requireTenant, BackupController.getHistoricalMonthDetails);
router.get('/data/audit-logs', authenticate, requireTenant, BackupController.getAuditLogs);
router.post('/data/export/download', authenticate, requireTenant, BackupController.exportOwnerData);

export default router;
