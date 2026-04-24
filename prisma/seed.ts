import { PrismaClient, Role, TransactionType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main(): Promise<void> {
  const adminPassword = await bcrypt.hash('admin12345', SALT_ROUNDS);
  const userPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@revobank.test',
      fullName: 'RevoBank Admin',
      hashedPassword: adminPassword,
      role: Role.ADMIN,
    },
  });

  const aliceUser = await prisma.user.create({
    data: {
      email: 'alice@revobank.test',
      fullName: 'Alice Johnson',
      hashedPassword: userPassword,
      role: Role.USER,
    },
  });

  const bobUser = await prisma.user.create({
    data: {
      email: 'bob@revobank.test',
      fullName: 'Bob Smith',
      hashedPassword: userPassword,
      role: Role.USER,
    },
  });

  const adminAccount = await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountNumber: '9000000001',
      accountName: 'Admin Operations',
      currency: 'IDR',
      balance: new Prisma.Decimal('500000.00'),
    },
  });

  const aliceMainAccount = await prisma.account.create({
    data: {
      userId: aliceUser.id,
      accountNumber: '1000000001',
      accountName: 'Alice Main Account',
      currency: 'IDR',
      balance: new Prisma.Decimal('325000.00'),
    },
  });

  const aliceSavingsAccount = await prisma.account.create({
    data: {
      userId: aliceUser.id,
      accountNumber: '1000000002',
      accountName: 'Alice Savings',
      currency: 'IDR',
      balance: new Prisma.Decimal('1000000.00'),
    },
  });

  const bobMainAccount = await prisma.account.create({
    data: {
      userId: bobUser.id,
      accountNumber: '2000000001',
      accountName: 'Bob Main Account',
      currency: 'IDR',
      balance: new Prisma.Decimal('225000.00'),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: adminAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('500000.00'),
        balanceBefore: new Prisma.Decimal('0.00'),
        balanceAfter: new Prisma.Decimal('500000.00'),
        referenceNumber: 'SEED-ADM-DEP-001',
        description: 'Initial admin funding',
      },
      {
        accountId: aliceMainAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('300000.00'),
        balanceBefore: new Prisma.Decimal('0.00'),
        balanceAfter: new Prisma.Decimal('300000.00'),
        referenceNumber: 'SEED-ALC-DEP-001',
        description: 'Initial deposit',
      },
      {
        accountId: aliceMainAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('100000.00'),
        balanceBefore: new Prisma.Decimal('300000.00'),
        balanceAfter: new Prisma.Decimal('400000.00'),
        referenceNumber: 'SEED-ALC-DEP-002',
        description: 'Salary top-up',
      },
      {
        accountId: aliceMainAccount.id,
        type: TransactionType.TRANSFER,
        amount: new Prisma.Decimal('75000.00'),
        balanceBefore: new Prisma.Decimal('400000.00'),
        balanceAfter: new Prisma.Decimal('325000.00'),
        referenceNumber: 'SEED-ALC-TRF-001',
        description: 'Transfer to Bob main account',
      },
      {
        accountId: aliceMainAccount.id,
        type: TransactionType.WITHDRAW,
        amount: new Prisma.Decimal('25000.00'),
        balanceBefore: new Prisma.Decimal('325000.00'),
        balanceAfter: new Prisma.Decimal('300000.00'),
        referenceNumber: 'SEED-ALC-WDR-001',
        description: 'ATM cash withdrawal',
      },
      {
        accountId: aliceMainAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('25000.00'),
        balanceBefore: new Prisma.Decimal('300000.00'),
        balanceAfter: new Prisma.Decimal('325000.00'),
        referenceNumber: 'SEED-ALC-DEP-003',
        description: 'Cashback adjustment',
      },
      {
        accountId: aliceSavingsAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('1000000.00'),
        balanceBefore: new Prisma.Decimal('0.00'),
        balanceAfter: new Prisma.Decimal('1000000.00'),
        referenceNumber: 'SEED-ALC-SAV-001',
        description: 'Savings seed fund',
      },
      {
        accountId: bobMainAccount.id,
        type: TransactionType.DEPOSIT,
        amount: new Prisma.Decimal('150000.00'),
        balanceBefore: new Prisma.Decimal('0.00'),
        balanceAfter: new Prisma.Decimal('150000.00'),
        referenceNumber: 'SEED-BOB-DEP-001',
        description: 'Initial deposit',
      },
      {
        accountId: bobMainAccount.id,
        type: TransactionType.TRANSFER,
        amount: new Prisma.Decimal('75000.00'),
        balanceBefore: new Prisma.Decimal('150000.00'),
        balanceAfter: new Prisma.Decimal('225000.00'),
        referenceNumber: 'SEED-BOB-TRF-001',
        description: 'Transfer from Alice main account',
      },
    ],
  });

  console.log('Seed completed successfully.');
  console.log('Admin login: admin@revobank.test / admin12345');
  console.log('User login: alice@revobank.test / password123');
  console.log('User login: bob@revobank.test / password123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
