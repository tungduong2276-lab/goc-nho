// Cấu hình Firebase của project "goc-nho".
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAv5g_AcI_rnpJWvIAlgYNI0owMHRX7-Z8",
  authDomain: "goc-nho.firebaseapp.com",
  projectId: "goc-nho",
  storageBucket: "goc-nho.firebasestorage.app",
  messagingSenderId: "1082221411251",
  appId: "1:1082221411251:web:74ec9ab1ad9df45a5369c6"
};

// App Check (tùy chọn) — chế độ theo dõi, không chặn ai. Để trống siteKey = tắt hoàn toàn.
// siteKey là khóa CÔNG KHAI của reCAPTCHA (không phải secret). Đọc docs/M0-APP-CHECK-MONITORING-PLAN.md trước khi điền.
window.FIREBASE_APP_CHECK = { provider: "recaptcha-enterprise", siteKey: "" };
