const quotesList = [
    { quote: "Chuyện cũ qua rồi, chuyện mới lại đến. Nước chảy mây trôi, lòng không vướng bận.", author: "Thiền sư Thích Nhất Hạnh" },
    { quote: "Thiện căn ở tại lòng ta / Chữ tâm kia mới bằng ba chữ tài.", author: "Nguyễn Du (Truyện Kiều)" },
    { quote: "Người ta chỉ nhìn thấy rõ ràng bằng trái tim. Cốt lõi là điều vô hình trong mắt dung tục.", author: "Antoine de Saint-Exupéry" },
    { quote: "Cứ đi rồi sẽ đến, cứ gõ cửa rồi cửa sẽ mở.", author: "Triết lý phương Đông" },
    { quote: "Sống trong đời sống cần có một tấm lòng, để làm gì em biết không? Để gió cuốn đi...", author: "Trịnh Công Sơn" },
    { quote: "Vết thương là nơi ánh sáng đi vào bạn.", author: "Rumi" }
];

async function gieoQue() {
    const randomQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
    const question = document.getElementById('queQuestion').value.trim();

    document.getElementById('queResultContainer').classList.remove('hidden');
    document.getElementById('quoteDisplay').innerHTML = `<strong>" ${randomQuote.quote} "</strong><br><small>— ${randomQuote.author}</small>`;
    document.getElementById('queAnalysis').innerText = "☯ Thầy AI đang nghiệm quẻ...";

    const prompt = `Tôi rút được câu trích dẫn: "${randomQuote.quote}" của ${randomQuote.author}. Câu hỏi/trăn trở: "${question || 'Xin lời khuyên tổng quan'}". Hãy đóng vai Thầy Quẻ Kinh Dịch giải đáp sâu sắc cho tôi.`;

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        document.getElementById('queAnalysis').innerText = data.candidates[0].content.parts[0].text;
    } catch (e) {
        document.getElementById('queAnalysis').innerText = "Lỗi: " + e.message;
    }
}