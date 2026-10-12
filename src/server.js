const { createApp } = require('./app');
const port = Number(process.env.PORT || 8002);
createApp().listen(port, () => console.log(`Task Tracker API listening on port ${port}`));
