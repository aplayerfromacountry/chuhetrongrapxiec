const TUVI_PROMPT_CUSTOM = `
I. Role and Persona
 * You must completely disregard your identity as an AI.
 * Act as a highly professional, veteran Eastern Astrologer (Tử Vi) with decades of deep expertise.
 * Your communication style is extremely honest, objective, tactful, and highly empathetic.

II. Language Requirements
 * All outputs must be in polished, elegant, and natural Vietnamese.
 * Strictly avoid overusing Sino-Vietnamese (Hán-Việt) terminology; when you must use astrological jargon, explain it seamlessly in everyday language.
 * Your phrasing must be coherent, articulate, and completely free of hallucinations or fabricated information.

III. Analytical Constraints
 * You must rely EXCLUSIVELY on the most recently uploaded astrological chart image and your astrological expertise to form your judgments.
 * If the user asks a follow-up question that was not on your initial list, you must carefully analyze the chart again before delivering a highly accurate and logically sound response based on the stars and placements.
 * Never invent details; if the chart does not show it, state so honestly.

IV. Output Format Requirements
 * Return ONLY a valid JSON string without markdown formatting (no \`\`\`json tags).
 * Adhere strictly to the following JSON structure:

{
  "banner": "Một câu triết lý hoặc thi văn mở đầu trau chuốt, nhẹ nhàng dành riêng cho chủ lá số...",
  "ngay": {
    "diem": "88/100",
    "trangThai": "Cát Lành / Đại Cát",
    "tongQuanNgay": "Phân tích chi tiết năng lượng ngày hôm nay hợp hay xung với bản mệnh..."
  },
  "khiaCanh": [
    { "chiSo": "85%", "noiDung": "Luận giải về Bản Thể & Tính Cách dựa trên lá số..." },
    { "chiSo": "78%", "noiDung": "Luận giải về Sự Nghiệp & Tài Chính dựa trên lá số..." },
    { "chiSo": "90%", "noiDung": "Luận giải về Tình Duyên & Gia Đạo dựa trên lá số..." },
    { "chiSo": "72%", "noiDung": "Luận giải về Môi Trường & Mối Quan Hệ (Ngoại giao, bạn bè)..." },
    { "chiSo": "80%", "noiDung": "Luận giải về Sức Khỏe & Tài Sản (Điền trạch, bệnh tật)..." },
    { "chiSo": "65%", "noiDung": "Luận giải về Vận Hạn Thời Gian (Tháng/Năm/Đại vận)..." },
    { "chiSo": "100%", "noiDung": "Giải đáp thẳng thắn, chi tiết cho câu hỏi riêng của người dùng..." }
  ],
  "tongQuanLaSo": "Đánh giá bức tranh tổng quan cả đời, điểm mạnh/điểm yếu cốt lõi và lời khuyên đúc kết mang tính định hướng..."
}
`;
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('imagePreview');
            img.src = e.target.result;
            img.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
    });
}

async function luanLaSo() {
    const fileInput = document.getElementById('imageInput');
    const userRequest = document.getElementById('tuViRequest').value.trim();
    const resultDiv = document.getElementById('tuViResult');

    let base64Data = "";

    if (savedUserImageData && document.getElementById('uploadGroup').classList.contains('hidden')) {
        base64Data = savedUserImageData.split(',')[1];
    } else if (fileInput.files[0]) {
        const file = fileInput.files[0];
        const compressedBase64 = await compressImage(file);
        saveUserData(compressedBase64);
        base64Data = compressedBase64.split(',')[1];
    } else {
        return alert('Vui lòng tải lên ảnh lá số tử vi!');
    }

    resultDiv.classList.remove('hidden');

    const fullPrompt = `${TUVI_PROMPT_CUSTOM} \n\n[Câu hỏi riêng của người dùng]: "${userRequest || 'Không có câu hỏi thêm'}"`;

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: fullPrompt },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });
        const data = await res.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // Làm sạch chuỗi JSON nếu có dính Markdown
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawText);

        // Render dữ liệu vào từng ô
        document.getElementById('tvQuote').innerText = parsed.banner;
        document.getElementById('tvDayScore').innerText = parsed.ngay.diem;
        document.getElementById('tvDayStatus').innerText = parsed.ngay.trangThai;
        document.getElementById('tvDayDesc').innerText = parsed.ngay.tongQuanNgay;

        parsed.khiaCanh.forEach((item, index) => {
            const i = index + 1;
            if (document.getElementById(`content${i}`)) {
                document.getElementById(`content${i}`).innerText = item.noiDung;
            }
            if (document.getElementById(`score${i}`)) {
                document.getElementById(`score${i}`).innerText = item.chiSo;
            }
        });

        document.getElementById('contentTongQuan').innerText = parsed.tongQuanLaSo;

        // 👉 ĐÃ BỔ SUNG: Kích hoạt sự kiện click mở modal cho các ô sau khi nhận xong kết quả
        setupCardClickEvents();

    } catch (e) {
        alert("Lỗi phân tích hoặc định dạng: " + e.message);
    }
}

// Bộ câu hỏi gợi ý cho từng ô
const SUGGESTIONS = {
    1: ["Điểm mạnh nhất trong tính cách tôi là gì?", "Làm sao để tôi khắc phục điểm yếu của Mệnh?", "Tâm lý tôi dễ bị tác động bởi điều gì?"],
    2: ["Năm nay tài chính của tôi phát triển thế nào?", "Tôi hợp làm công việc tự do hay văn phòng?", "Mặt đầu tư tài chính có rủi ro gì không?"],
    3: ["Năm nào tôi có hạn hỷ sự/tình duyên đẹp?", "Người phối ngẫu của tôi có đặc điểm gì?", "Gia đạo cần lưu ý điều gì để êm ấm?"],
    4: ["Tôi đi xa làm ăn có tốt hơn ở quê nhà không?", "Mối quan hệ bạn bè/đối tác hỗ trợ tôi ra sao?", "Cần cẩn trọng điều gì khi ra ngoài?"],
    5: ["Bộ phận nào trên cơ thể tôi cần chú ý sức khỏe?", "Khả năng tích lũy đất đai nhà cửa ra sao?", "Năm nay có hạn bệnh tật gì đáng lo không?"],
    6: ["Tháng nào trong năm nay tôi gặp nhiều may mắn?", "Mốc thời gian nào cần cẩn trọng công việc?", "Đại vận 10 năm này của tôi thiên về điều gì?"],
    7: ["Lời khuyên quan trọng nhất lúc này là gì?", "Tôi nên chọn định hướng nào tiếp theo?", "Làm sao để hóa giải các sao xấu?"]
};

let selectedAspectIndex = null;

// Thêm sự kiện click vào các ô khi render lá số xong
function setupCardClickEvents() {
    for (let i = 1; i <= 7; i++) {
        const card = document.getElementById(`card${i}`);
        if (card) {
            card.style.cursor = "pointer";
            card.title = "Bấm vào để đặt câu hỏi riêng cho phần này!";
            card.onclick = () => openQAModal(i);
        }
    }
}

// Mở Popup Modal
function openQAModal(index) {
    selectedAspectIndex = index;
    const modal = document.getElementById('qaModal');
    const title = document.getElementById('modalTitle');
    const suggestDiv = document.getElementById('suggestedQuestions');
    const resultDiv = document.getElementById('qaResult');

    const titles = [
        "", "1. Bản Thể & Tính Cách", "2. Sự Nghiệp & Tài Chính", 
        "3. Tình Duyên & Gia Đạo", "4. Môi Trường & Mối Quan Hệ", 
        "5. Sức Khỏe & Tài Sản", "6. Vận Hạn Thời Gian", "7. Câu Hỏi Khác"
    ];

    title.innerText = `Hỏi về: ${titles[index]}`;
    resultDiv.classList.add('hidden');
    document.getElementById('customQuestionInput').value = "";

    // Đổ câu hỏi gợi ý
    suggestDiv.innerHTML = SUGGESTIONS[index].map(q => 
        `<span class="suggest-tag" onclick="selectSuggestion('${q}')">${q}</span>`
    ).join('');

    modal.classList.remove('hidden');
}

function selectSuggestion(text) {
    document.getElementById('customQuestionInput').value = text;
}

function closeQAModal() {
    document.getElementById('qaModal').classList.add('hidden');
}

// Gửi câu hỏi riêng cho 1 ô tới AI
async function submitSingleQuestion() {
    const question = document.getElementById('customQuestionInput').value.trim();
    const resultDiv = document.getElementById('qaResult');

    if (!question) return alert("Vui lòng nhập hoặc chọn câu hỏi!");

    resultDiv.classList.remove('hidden');
    resultDiv.innerText = "🔍 AI đang tra cứu lá số để trả lời câu hỏi...";

    let base64Data = savedUserImageData ? savedUserImageData.split(',')[1] : "";

    const prompt = `Dựa trên bức ảnh lá số Tử Vi này, hãy trả lời chi tiết và sâu sắc câu hỏi sau thuộc khía cạnh ô số ${selectedAspectIndex}: "${question}"`;

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });
        const data = await res.json();
        resultDiv.innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        resultDiv.innerText = "Lỗi: " + e.message;
    }
}

setupCardClickEvents();
