let isSignUpMode = false;
let currentUser = null;
let savedUserImageData = null;

// Kiểm tra xem đã đăng nhập chưa khi bấm "VÀO ĐÂY"
function checkAuthAndGo() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
            switchSection('landingPage', 'selectMenuPage');
        } else {
            switchSection('landingPage', 'authPage');
        }
    });
}

// Đổi giao diện qua lại giữa Đăng Nhập & Đăng Ký
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authBtn');
    const text = document.getElementById('authToggleText');
    const link = document.getElementById('authToggleLink');
function openChoiceModal() {
    document.getElementById('choiceModal').classList.remove('hidden');
}

// Đóng Pop-up lựa chọn
function closeChoiceModal() {
    document.getElementById('choiceModal').classList.add('hidden');
}

// Chuyển sang màn hình Đăng Nhập hoặc Đăng Ký
function goToAuth(mode) {
    closeChoiceModal();
    if (mode === 'register') {
        isSignUp = true;
        document.getElementById('authTitle').innerText = 'ĐĂNG KÝ';
        document.getElementById('authBtn').innerText = 'Đăng Ký';
        document.getElementById('authToggleText').innerText = 'Đã có tài khoản?';
        document.getElementById('authToggleLink').innerText = 'Đăng nhập ngay';
    } else {
        isSignUp = false;
        document.getElementById('authTitle').innerText = 'ĐĂNG NHẬP';
        document.getElementById('authBtn').innerText = 'Đăng Nhập';
        document.getElementById('authToggleText').innerText = 'Chưa có tài khoản?';
        document.getElementById('authToggleLink').innerText = 'Đăng ký ngay';
    }
    switchSection('landingPage', 'authPage');
}

// Đăng nhập dưới dạng Khách Ẩn Danh (sử dụng Firebase Anonymous Auth)
function loginAsGuest() {
    closeChoiceModal();
    auth.signInAnonymously()
        .then(() => {
            switchSection('landingPage', 'selectMenuPage');
        })
        .catch((error) => {
            alert("Lỗi truy cập ẩn danh: " + error.message);
        });
}

    if (isSignUpMode) {
        title.innerText = "ĐĂNG KÝ TÀI KHOẢN";
        btn.innerText = "Tạo Tài Khoản";
        text.innerText = "Đã có tài khoản?";
        link.innerText = "Đăng nhập ngay";
    } else {
        title.innerText = "ĐĂNG NHẬP";
        btn.innerText = "Đăng Nhập";
        text.innerText = "Chưa có tài khoản?";
        link.innerText = "Đăng ký ngay";
    }
}

// Xử lý Đăng Ký / Đăng Nhập
async function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();

    if (!email || !password) return alert("Vui lòng điền đầy đủ Email và Mật khẩu!");

    try {
        if (isSignUpMode) {
            const res = await auth.createUserWithEmailAndPassword(email, password);
            alert("Tạo tài khoản thành công!");
            currentUser = res.user;
        } else {
            const res = await auth.signInWithEmailAndPassword(email, password);
            currentUser = res.user;
        }
        loadUserData(currentUser.uid);
        switchSection('authPage', 'selectMenuPage');
    } catch (err) {
        alert("Lỗi: " + err.message);
    }
}

// Tải lá số cũ từ Cloud Firebase về
function loadUserData(uid) {
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists && doc.data().lasoImage) {
            savedUserImageData = doc.data().lasoImage;
            document.getElementById('savedImagePreview').src = savedUserImageData;
            document.getElementById('savedImageContainer').classList.remove('hidden');
            document.getElementById('uploadGroup').classList.add('hidden');
        }
    });
}

// Lưu lá số mới lên Cloud Firebase
function saveUserData(base64Image) {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({
            lasoImage: base64Image,
            updatedAt: new Date()
        }, { merge: true });
    }
}

// Đổi ảnh lá số
function changeImageMode() {
    document.getElementById('savedImageContainer').classList.add('hidden');
    document.getElementById('uploadGroup').classList.remove('hidden');
}

// Đăng xuất
function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        savedUserImageData = null;
        switchSection('selectMenuPage', 'landingPage');
    });
}