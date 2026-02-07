// グローバル変数
let memos = [];
let editingId = null;

// DOM要素
const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const memoForm = document.getElementById('memoForm');
const memoList = document.getElementById('memoList');
const newMemoBtn = document.getElementById('newMemoBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');

// フィルター要素
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const filterType = document.getElementById('filterType');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadMemos();
    renderMemos();
    setupEventListeners();
});

// イベントリスナー設定
function setupEventListeners() {
    newMemoBtn.addEventListener('click', showNewMemoForm);
    cancelBtn.addEventListener('click', showListView);
    memoForm.addEventListener('submit', handleSubmit);
    
    // フィルターイベント
    filterStartDate.addEventListener('change', renderMemos);
    filterEndDate.addEventListener('change', renderMemos);
    filterType.addEventListener('change', renderMemos);
    clearFilterBtn.addEventListener('click', clearFilters);
}

// LocalStorageからデータ読み込み
function loadMemos() {
    const saved = localStorage.getItem('pickleballMemos');
    if (saved) {
        memos = JSON.parse(saved);
    }
}

// LocalStorageにデータ保存
function saveMemos() {
    localStorage.setItem('pickleballMemos', JSON.stringify(memos));
}

// 新規メモフォーム表示
function showNewMemoForm() {
    editingId = null;
    formTitle.textContent = '新規メモ';
    memoForm.reset();
    
    // 今日の日付をデフォルトに
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('memoDate').value = today;
    
    listView.style.display = 'none';
    formView.style.display = 'block';
}

// 一覧表示に戻る
function showListView() {
    formView.style.display = 'none';
    listView.style.display = 'block';
}

// フォーム送信処理
function handleSubmit(e) {
    e.preventDefault();
    
    const memoData = {
        id: editingId || Date.now(),
        date: document.getElementById('memoDate').value,
        type: document.getElementById('memoType').value,
        summary: document.getElementById('summary').value,
        goodPoints: document.getElementById('goodPoints').value,
        improvements: document.getElementById('improvements').value,
        coachAdvice: document.getElementById('coachAdvice').value,
        createdAt: editingId ? memos.find(m => m.id === editingId).createdAt : Date.now()
    };
    
    if (editingId) {
        // 編集
        const index = memos.findIndex(m => m.id === editingId);
        memos[index] = memoData;
    } else {
        // 新規追加
        memos.push(memoData);
    }
    
    saveMemos();
    renderMemos();
    showListView();
}

// メモ一覧表示
function renderMemos() {
    const filteredMemos = getFilteredMemos();
    
    if (filteredMemos.length === 0) {
        memoList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">メモがありません</div>
            </div>
        `;
        return;
    }
    
    // 新しい順にソート
    const sortedMemos = [...filteredMemos].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    memoList.innerHTML = sortedMemos.map(memo => `
        <div class="memo-card">
            <div class="memo-header">
                <span class="memo-date">${formatDate(memo.date)}</span>
                <span class="memo-type">${memo.type}</span>
            </div>
            <div class="memo-content">
                ${memo.summary ? `
                    <div class="memo-section">
                        <div class="memo-section-title">📝 内容総括</div>
                        <div class="memo-section-text">${memo.summary}</div>
                    </div>
                ` : ''}
                ${memo.goodPoints ? `
                    <div class="memo-section">
                        <div class="memo-section-title">✅ 良かったこと</div>
                        <div class="memo-section-text">${memo.goodPoints}</div>
                    </div>
                ` : ''}
                ${memo.improvements ? `
                    <div class="memo-section">
                        <div class="memo-section-title">📈 改善点</div>
                        <div class="memo-section-text">${memo.improvements}</div>
                    </div>
                ` : ''}
                ${memo.coachAdvice ? `
                    <div class="memo-section">
                        <div class="memo-section-title">💡 コーチのアドバイス</div>
                        <div class="memo-section-text">${memo.coachAdvice}</div>
                    </div>
                ` : ''}
            </div>
            <div class="memo-actions">
                <button class="btn btn-secondary btn-small" onclick="editMemo(${memo.id})">編集</button>
                <button class="btn btn-danger btn-small" onclick="deleteMemo(${memo.id})">削除</button>
            </div>
        </div>
    `).join('');
}

// フィルター適用
function getFilteredMemos() {
    let filtered = [...memos];
    
    // 日付範囲フィルター
    const startDate = filterStartDate.value;
    const endDate = filterEndDate.value;
    
    if (startDate) {
        filtered = filtered.filter(m => m.date >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(m => m.date <= endDate);
    }
    
    // タイプフィルター
    const type = filterType.value;
    if (type) {
        filtered = filtered.filter(m => m.type === type);
    }
    
    return filtered;
}

// フィルタークリア
function clearFilters() {
    filterStartDate.value = '';
    filterEndDate.value = '';
    filterType.value = '';
    renderMemos();
}

// メモ編集
function editMemo(id) {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;
    
    editingId = id;
    formTitle.textContent = 'メモ編集';
    
    document.getElementById('memoDate').value = memo.date;
    document.getElementById('memoType').value = memo.type;
    document.getElementById('summary').value = memo.summary || '';
    document.getElementById('goodPoints').value = memo.goodPoints || '';
    document.getElementById('improvements').value = memo.improvements || '';
    document.getElementById('coachAdvice').value = memo.coachAdvice || '';
    
    listView.style.display = 'none';
    formView.style.display = 'block';
}

// メモ削除
function deleteMemo(id) {
    if (!confirm('このメモを削除しますか?')) return;
    
    memos = memos.filter(m => m.id !== id);
    saveMemos();
    renderMemos();
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日（${weekday}）`;
}