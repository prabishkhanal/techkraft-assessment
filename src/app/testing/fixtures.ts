import { Application, ApplicationStatus, Role, SessionUser } from '../core/models';
export const testApplication: Application = {
  id: 'app-2',
  createdBy: 'sales-user',
  assignedTo: 'reviewer-user',
  status: ApplicationStatus.Submitted,
  businessName: 'Demo Shop',
  businessType: 'Retail',
  registrationNumber: 'DEMO-1',
  contactName: 'Demo Contact',
  contactEmail: 'demo@example.test',
  contactPhone: '+1 202 555 0100',
  taxId: '••••0001',
  bankAccountNumber: '••••1234',
  estimatedMonthlyVolume: 1000,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};
export function testUser(role: Role = Role.Sales): SessionUser {
  return {
    username: `${role.toLowerCase()}-user`,
    role,
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
  };
}
