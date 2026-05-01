self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // مطلوب لتخطي فحص كروم لزر التحميل
});
