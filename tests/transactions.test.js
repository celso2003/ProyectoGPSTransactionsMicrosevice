// const request = require('supertest');
// const express = require('express');
// const transactionRoutes = require('../src/routes/transactionRoutes');
// const transactionController = require('../src/controllers/transactionController');

// // Simular el controlador de transacciones
// jest.mock('../src/controllers/transactionController', () => ({
//   createTransaction: jest.fn(),
//   getAllTransactions: jest.fn(),
//   getTransactionsByRut: jest.fn(),
//   getTransactionsByDateRange: jest.fn(),
//   getTransactionsByDateRangeAndRut: jest.fn(),
//   getTransactionById: jest.fn(),
//   updateTransaction: jest.fn(),
//   deleteTransaction: jest.fn()
// }));

// describe('Transaction Routes', () => {
//   let app;

//   beforeEach(() => {
//     app = express();
//     app.use(express.json());
//     app.use(transactionRoutes);
    
//     // Reiniciar todos los mocks entre pruebas
//     jest.clearAllMocks();
//   });

//   describe('POST / - Crear Transacción', () => {
//     it('debería llamar al controlador createTransaction', async () => {
//       // Implementación simulada del controlador
//       transactionController.createTransaction.mockImplementation((req, res) => {
//         const newTransaction = { 
//           id: 1, 
//           ...req.body,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };
//         return res.status(201).json(newTransaction);
//       });

//       const transactionData = {
//         rut: '12345678-9',
//         products: [{ productId: 1, quantity: 5 }],
//         paymentMethod: 'cash',
//         notes: 'Test transaction'
//       };

//       const response = await request(app)
//         .post('/')
//         .send(transactionData);

//       expect(response.status).toBe(201);
//       expect(transactionController.createTransaction).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('id');
//       expect(response.body.rut).toBe('12345678-9');
//     });

//     it('debería validar los datos de la transacción', async () => {
//       // Datos inválidos - faltan campos requeridos
//       const invalidData = {
//         // Falta rut
//         paymentMethod: 'cash'
//         // Falta products
//       };

//       const response = await request(app)
//         .post('/')
//         .send(invalidData);
      
//       // Express-validator pasará los errores al controlador
//       expect(transactionController.createTransaction).toHaveBeenCalled();
//     });
//   });

//   describe('GET / - Obtener Todas las Transacciones', () => {
//     it('debería llamar al controlador getAllTransactions', async () => {
//       transactionController.getAllTransactions.mockImplementation((req, res) => {
//         return res.status(200).json({
//           transactions: [
//             { id: 1, rut: '12345678-9', transactionDate: new Date() },
//             { id: 2, rut: '98765432-1', transactionDate: new Date() }
//           ],
//           totalTransactions: 2,
//           currentPage: 1
//         });
//       });

//       const response = await request(app).get('/');

//       expect(response.status).toBe(200);
//       expect(transactionController.getAllTransactions).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('transactions');
//       expect(response.body.transactions).toHaveLength(2);
//     });

//     it('debería pasar los parámetros de consulta al controlador', async () => {
//       transactionController.getAllTransactions.mockImplementation((req, res) => {
//         return res.status(200).json({
//           transactions: [{ id: 1 }],
//           totalTransactions: 1,
//           currentPage: 1,
//           ...req.query
//         });
//       });

//       const response = await request(app)
//         .get('/')
//         .query({ page: 2, limit: 10 });

//       expect(response.status).toBe(200);
//       expect(transactionController.getAllTransactions).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('page', '2');
//       expect(response.body).toHaveProperty('limit', '10');
//     });
//   });

//   describe('GET /person/:rut - Obtener Transacciones por RUT', () => {
//     it('debería llamar al controlador getTransactionsByRut con los parámetros correctos', async () => {
//       transactionController.getTransactionsByRut.mockImplementation((req, res) => {
//         return res.status(200).json({
//           rut: req.params.rut,
//           personName: 'Test Person',
//           transactions: [
//             { id: 1, rut: req.params.rut, transactionDate: new Date() }
//           ]
//         });
//       });

//       const response = await request(app).get('/person/12345678-9');

//       expect(response.status).toBe(200);
//       expect(transactionController.getTransactionsByRut).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('rut', '12345678-9');
//       expect(response.body).toHaveProperty('transactions');
//     });
//   });

//   describe('GET /date-range - Obtener Transacciones por Rango de Fechas', () => {
//     it('debería llamar al controlador getTransactionsByDateRange', async () => {
//       transactionController.getTransactionsByDateRange.mockImplementation((req, res) => {
//         return res.status(200).json({
//           startDate: req.query.startDate,
//           endDate: req.query.endDate,
//           transactions: [
//             { id: 1, transactionDate: new Date('2023-01-15') }
//           ],
//           totalTransactions: 1
//         });
//       });

//       const response = await request(app)
//         .get('/date-range')
//         .query({ startDate: '2023-01-01', endDate: '2023-01-31' });

//       expect(response.status).toBe(200);
//       expect(transactionController.getTransactionsByDateRange).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('startDate', '2023-01-01');
//       expect(response.body).toHaveProperty('endDate', '2023-01-31');
//     });
//   });

//   describe('GET /date-range-rut - Obtener Transacciones por Rango de Fechas y RUT', () => {
//     it('debería llamar al controlador getTransactionsByDateRangeAndRut', async () => {
//       transactionController.getTransactionsByDateRangeAndRut.mockImplementation((req, res) => {
//         return res.status(200).json({
//           rut: req.query.rut,
//           startDate: req.query.startDate,
//           endDate: req.query.endDate,
//           transactions: [
//             { id: 1, rut: req.query.rut, transactionDate: new Date('2023-01-15') }
//           ]
//         });
//       });

//       const response = await request(app)
//         .get('/date-range-rut')
//         .query({ 
//           rut: '12345678-9',
//           startDate: '2023-01-01', 
//           endDate: '2023-01-31' 
//         });

//       expect(response.status).toBe(200);
//       expect(transactionController.getTransactionsByDateRangeAndRut).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('rut', '12345678-9');
//       expect(response.body).toHaveProperty('startDate', '2023-01-01');
//       expect(response.body).toHaveProperty('endDate', '2023-01-31');
//     });
//   });

//   describe('GET /:id - Obtener Transacción por ID', () => {
//     it('debería llamar al controlador getTransactionById con el ID correcto', async () => {
//       transactionController.getTransactionById.mockImplementation((req, res) => {
//         return res.status(200).json({
//           id: parseInt(req.params.id),
//           rut: '12345678-9',
//           transactionDate: new Date(),
//           products: [{ productId: 1, quantity: 2 }]
//         });
//       });

//       const response = await request(app).get('/1');

//       expect(response.status).toBe(200);
//       expect(transactionController.getTransactionById).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('id', 1);
//     });
//   });

//   describe('PUT /:id - Actualizar Transacción', () => {
//     it('debería llamar al controlador updateTransaction con el ID y datos correctos', async () => {
//       transactionController.updateTransaction.mockImplementation((req, res) => {
//         const updatedTransaction = {
//           id: parseInt(req.params.id),
//           ...req.body,
//           updatedAt: new Date()
//         };
//         return res.status(200).json(updatedTransaction);
//       });

//       const updateData = {
//         paymentMethod: 'credit_card',
//         notes: 'Updated transaction',
//         products: [{ productId: 2, quantity: 3 }]
//       };

//       const response = await request(app)
//         .put('/1')
//         .send(updateData);

//       expect(response.status).toBe(200);
//       expect(transactionController.updateTransaction).toHaveBeenCalled();
//       expect(response.body).toHaveProperty('id', 1);
//       expect(response.body.paymentMethod).toBe('credit_card');
//     });

//     it('debería validar los datos de actualización', async () => {
//       const invalidData = {
//         paymentMethod: 'invalid_method',  // Método de pago inválido
//         products: [{ productId: 'abc', quantity: -5 }]  // Formato de producto inválido
//       };

//       const response = await request(app)
//         .put('/1')
//         .send(invalidData);

//       // Express-validator pasará los errores al controlador
//       expect(transactionController.updateTransaction).toHaveBeenCalled();
//     });
//   });

//   describe('DELETE /:id - Eliminar Transacción', () => {
//     it('debería llamar al controlador deleteTransaction con el ID correcto', async () => {
//       transactionController.deleteTransaction.mockImplementation((req, res) => {
//         return res.status(204).send();
//       });

//       const response = await request(app).delete('/1');

//       expect(response.status).toBe(204);
//       expect(transactionController.deleteTransaction).toHaveBeenCalled();
//     });
//   });
// });