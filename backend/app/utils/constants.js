/**
 * @description Application constants
 */

// Order status constants

import dotenv from 'dotenv';
dotenv.config();

const ADDRESSES = {
  "network": "sepolia",
  "chainId": 11155111,
  "accessToken": "0x7563F2D779e0F8be890DBa6aaA6b9AC5B88093F3",
  "cardanoEscrowFactory": "0xfd58bAed5BcD4A7db3B7a0285a82855881748549",
  "limitOrderProtocol": "0x5ce0524525EaB2f570D37FDE4cDD2fAf40629cAF",
  "cardanoEscrowSrcImplementation": "0x71A6FFEB517c388Ef0C974263FBCB861BdAA0d52",
  "cardanoEscrowDstImplementation": "0x7949497338822A18AA94491BD80DeCd90EDC8472",
  "deployedAt": "2025-07-28T18:40:38.187Z"
}


const ORDER_STATUSES = {
  PENDING: 'pending',
  DEPOSITING: 'depositing',
  WITHDRAWING: 'withdrawing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Valid order statuses array
const VALID_ORDER_STATUSES = Object.values(ORDER_STATUSES);

// Supported blockchain networks
const SUPPORTED_CHAINS = {
  EVM: 'EVM',
  CARDANO: 'Cardano',
  ETHEREUM: 'Ethereum',
  POLYGON: 'Polygon',
  BSC: 'BSC'
};

// Pagination limits
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Error messages
const ERROR_MESSAGES = {
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_STATUS: 'Invalid or missing status field',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  ORDER_ALREADY_EXISTS: 'An order with this hashlock already exists',
  CANNOT_ACCEPT_ORDER: 'Order cannot be accepted',
  NO_TX_HASH_PROVIDED: 'No transaction hash provided to update',
  INTERNAL_SERVER_ERROR: 'Internal server error'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

export {
    ADDRESSES,
  ORDER_STATUSES,
  VALID_ORDER_STATUSES,
  SUPPORTED_CHAINS,
  PAGINATION,
  ERROR_MESSAGES,
  HTTP_STATUS,
};
