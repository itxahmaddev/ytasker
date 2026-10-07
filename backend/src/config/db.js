const mongoose = require('mongoose');

// Turn the driver's low-level errors into something actionable.
function explain(err, uri) {
  const host = (uri.match(/@([^/?]+)/) || [])[1] || 'your database host';
  if (err.code === 'ENOTFOUND' && /querySrv/i.test(err.message)) {
    return (
      `The Atlas cluster "${host}" does not exist in DNS (NXDOMAIN). ` +
      'It was most likely deleted, or the connection string is wrong. ' +
      'Open MongoDB Atlas > Database > Connect > Drivers, copy the current connection string ' +
      'into MONGO_URI, or use a local MongoDB: mongodb://127.0.0.1:27017/ytasker'
    );
  }
  if (/bad auth|authentication failed/i.test(err.message)) {
    return 'MongoDB rejected the username or password in MONGO_URI (URL-encode special characters in the password).';
  }
  if (err.name === 'MongooseServerSelectionError') {
    return (
      `Could not reach MongoDB at ${host}. For Atlas, add your IP under Network Access ` +
      '(or 0.0.0.0/0 for testing) and make sure the cluster is not paused.'
    );
  }
  return err.message;
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set (see backend/.env.example)');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    throw new Error(explain(err, uri));
  }
  console.log('MongoDB connected');
}

module.exports = connectDB;
