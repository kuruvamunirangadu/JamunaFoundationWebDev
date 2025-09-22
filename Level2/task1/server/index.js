
// Entry point for Express server
import express from 'express';
import userRoutes from './routes/users.js';
import resourceRoutes from './routes/resources.js';
import applicationRoutes from './routes/applications.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Community Resource Board API is running');
});




app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
