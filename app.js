// Supabase設定
const SUPABASE_URL = 'https://ssywsobtxprvhshtikts.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeXdzb2J0eHBydmhzaHRpa3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDQ3NjEsImV4cCI6MjA4NjAyMDc2MX0.CX_QklnwxxLW7OZBNa8ud_0N-kd0gGyMmV6uCX6xzJk';

// Supabaseクライアント初期化
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
document.addEventListener('DOMContentLoaded', async () => {
    await loadMemos();
    renderMemos();
    setupEventListeners();
});

// イベントリスナー設定
function setupEventListeners() {
    newMemoBtn.addEventListener('click', showNewMemoForm);
    cancelBtn.addEventListener('click', showListView);
    memoForm.addEventListener('submit', handleSubmit);
    
    filterStartDate.addEventListener('change', renderMemos);
    filterEndDate.addEventListener('change', renderMemos);
    filterType.addEventListener('change', renderMemos);
    clearFilterBtn.addEventListener('click', clearFilters);
}

// Supabaseからデータ読み込み
async function loadMemos() {
    try {
        const { data, error } = await supabase
            .from('memos')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        memos = data.map(memo => ({
            id: memo.id,
            date: memo.date,
            type: memo.type,
            summary: memo.summary || '',
            goodPoints: memo.good_points || '',
            improvements: memo.improvements || '',
            coachAdvice: memo.coach_advice || '',
            createdAt: new Date(memo.created_at).getTime()
        }));
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        alert('データの読み込みに失敗しました。エラー: ' + error.message);
    }
}

// 新規メモフォーム表示
function showNewMemoForm() {
    editingId = null;
    formTitle.textContent = '新規メモ';
    memoForm.reset();
    
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
async function handleSubmit(e) {
    e.preventDefault();
    
    const memoData = {
        date: document.getElementById('memoDate').value,
        type: document.getElementById('memoType').value,
        summary: document.getElementById('summary').value,
        good_points: document.getElementById('goodPoints').value,
        improvements: document.getElementById('improvements').value,
        coach_advice: document.getElementById('coachAdvice').value
    };
    
    try {
        if (editingId) {
            const { error } = await supabase
                .from('memos')
                .update(memoData)
                .eq('id', editingId);
            
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('memos')
                .insert([memoData]);
            
            if (error) throw error;
        }
        
        await loadMemos();
        renderMemos();
        showListView();
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました。エラー: ' + error.message);
    }
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
                        <div class="memo-section-text">${escapeHtml(memo.summary)}</div>
                    </div>
                ` : ''}
                ${memo.goodPoints ? `
                    <div class="memo-section">
                        <div class="memo-section-title">✅ 良かったこと</div>
                        <div class="memo-section-text">${escapeHtml(memo.goodPoints)}</div>
                    </div>
                ` : ''}
                ${memo.improvements ? `
                    <div class="memo-section">
                        <div class="memo-section-title">📈 改善点</div>
                        <div class="memo-section-text">${escapeHtml(memo.improvements)}</div>
                    </div>
                ` : ''}
                ${memo.coachAdvice ? `
                    <div class="memo-section">
                        <div class="memo-section-title">💡 コーチのアドバイス</div>
                        <div class="memo-section-text">${escapeHtml(memo.coachAdvice)}</div>
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
    
    const startDate = filterStartDate.value;
    const endDate = filterEndDate.value;
    
    if (startDate) {
        filtered = filtered.filter(m => m.date >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(m => m.date <= endDate);
    }
    
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
async function deleteMemo(id) {
    if (!confirm('このメモを削除しますか?')) return;
    
    try {
        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadMemos();
        renderMemos();
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。エラー: ' + error.message);
    }
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getDate() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日（${weekday}）`;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
