import orderService from '../services/orderService.js';
import { handleServiceError } from '../utils/errorHandler.js';
/**
 * @description Creates a new swap order.
 * This is typically called by the Maker's client.
 */
const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.status(201).json({ data: result.data});
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**s
 * @description Retrieves a list of orders with pagination and filtering.
 * Can be used to build a public order book.
 */
const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * @description Retrieves a single order by its UUID.
 */
const getOrderById = async (req, res) => {
  try {
    const result = await orderService.getOrderById(req.params.id);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * @description Allows a Resolver to accept a pending order.
 * This updates the order's status and assigns the resolver.
 */
const acceptOrder = async (req, res) => {
  try {
    const result = await orderService.acceptOrder(req.params.id, req.body.resolverAddress);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * @description Updates the transaction hashes for an order.
 * This can be used to record escrow and withdrawal transaction hashes.
 */
const updateOrderTxHashes = async (req, res) => {
  try {
    const result = await orderService.updateOrderTxHashes(req.params.id, req.body);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};

const updateOrderEscrowAddresses = async (req, res) => {  
  try {
    const result = await orderService.updateOrderEscrowAddresses(req.params.id, req.body);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * @description Updates the status of an order.
 * Used to move the order through its lifecycle (e.g., to 'withdrawing', 'completed', 'failed').
 */
const updateOrderStatus = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json(result.data);
  } catch (error) {
    handleServiceError(error, res);
  }
};


export {
  createOrder,
  getAllOrders,
  getOrderById,
  acceptOrder,
  updateOrderTxHashes,
  updateOrderStatus,
  updateOrderEscrowAddresses
};
