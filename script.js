class BookManager {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('books')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || [
            '文学', '科技', '历史', '艺术', '教育', '其他'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderBooks();
    }

    setupEventListeners() {
        // 表单提交
        document.getElementById('bookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });

        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterBooks(e.target.value);
        });

        // 导出全部图书
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportToExcel('all');
        });

        // 导出捐赠图书
        document.getElementById('exportDonatedBtn').addEventListener('click', () => {
            this.exportToExcel('donated');
        });

        // 分类管理
        document.getElementById('categoryBtn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        // 关闭模态框
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击模态框背景关闭
        document.getElementById('categoryModal').addEventListener('click', (e) => {
            if (e.target.id === 'categoryModal') {
                this.closeModal();
            }
        });
    }

    // 切换捐赠人字段显示
    toggleDonorField() {
        const isDonated = document.getElementById('isDonated').checked;
        document.getElementById('donorField').style.display = isDonated ? 'block' : 'none';
        if (!isDonated) {
            document.getElementById('donor').value = '';
        }
    }

    addBook() {
        const formData = new FormData(document.getElementById('bookForm'));
        const isDonated = document.getElementById('isDonated').checked;
        const donor = formData.get('donor').trim();
        
        const book = {
            id: Date.now().toString(),
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            category: formData.get('category'),
            isDonated: isDonated,
            donor: isDonated ? donor : '',
            remarks: formData.get('remarks').trim(),
            createdAt: new Date().toLocaleString('zh-CN')
        };

        if (!book.title || !book.author) {
            this.showToast('书名和作者为必填项！', 'error');
            return;
        }

        if (isDonated && !donor) {
            this.showToast('请填写捐赠人信息！', 'error');
            return;
        }

        this.books.unshift(book);
        this.saveBooks();
        this.renderBooks();
        document.getElementById('bookForm').reset();
        document.getElementById('isDonated').checked = false;
        document.getElementById('donorField').style.display = 'none';
        
        this.showToast('📚 图书添加成功！');
    }

    editBook(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        const bookElement = document.getElementById(`book-${id}`);
        const currentContent = bookElement.innerHTML;
        
        // 创建编辑表单
        bookElement.innerHTML = `
            <div class="book-edit-form">
                <h3 style="margin-bottom: 20px; color: #2d3748;">编辑图书信息</h3>
                <form onsubmit="bookManager.saveBookEdit('${id}'); return false;">
                    <div class="form-group">
                        <label>书名 *</label>
                        <input type="text" value="${this.escapeHtml(book.title)}" id="edit-title-${id}" required>
                    </div>
                    <div class="form-group">
                        <label>作者 *</label>
                        <input type="text" value="${this.escapeHtml(book.author)}" id="edit-author-${id}" required>
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select id="edit-category-${id}">
                            <option value="">请选择分类</option>
                            ${this.categories.map(cat => `
                                <option value="${this.escapeHtml(cat)}" ${cat === book.category ? 'selected' : ''}>${this.escapeHtml(cat)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="edit-isDonated-${id}" ${book.isDonated ? 'checked' : ''} onchange="bookManager.toggleEditDonorField('${id}')">
                            <span class="checkbox-checkmark"></span>
                            <span class="checkbox-label">是否捐赠</span>
                        </label>
                    </div>
                    <div class="form-group" id="edit-donorField-${id}" style="${book.isDonated ? '' : 'display: none;'}">
                        <label>捐赠人</label>
                        <input type="text" value="${this.escapeHtml(book.donor || '')}" id="edit-donor-${id}">
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea id="edit-remarks-${id}" rows="3">${this.escapeHtml(book.remarks || '')}</textarea>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 10px 20px; font-size: 14px;">保存</button>
                        <button type="button" onclick="bookManager.cancelEdit('${id}', \`${this.escapeHtml(currentContent)}\`)" style="background: linear-gradient(135deg, #a0aec0 0%, #718096 100%); padding: 10px 20px; font-size: 14px;">取消</button>
                    </div>
                </form>
            </div>
        `;

        // 初始化捐赠字段显示状态
        if (book.isDonated) {
            document.getElementById(`edit-donorField-${id}`).style.display = 'block';
        }
    }

    toggleEditDonorField(id) {
        const isDonated = document.getElementById(`edit-isDonated-${id}`).checked;
        document.getElementById(`edit-donorField-${id}`).style.display = isDonated ? 'block' : 'none';
    }

    saveBookEdit(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        const title = document.getElementById(`edit-title-${id}`).value.trim();
        const author = document.getElementById(`edit-author-${id}`).value.trim();
        const category = document.getElementById(`edit-category-${id}`).value;
        const isDonated = document.getElementById(`edit-isDonated-${id}`).checked;
        const donor = document.getElementById(`edit-donor-${id}`).value.trim();
        const remarks = document.getElementById(`edit-remarks-${id}`).value.trim();

        if (!title || !author) {
            this.showToast('书名和作者为必填项！', 'error');
            return;
        }

        if (isDonated && !donor) {
            this.showToast('请填写捐赠人信息！', 'error');
            return;
        }

        // 更新图书信息
        book.title = title;
        book.author = author;
        book.category = category;
        book.isDonated = isDonated;
        book.donor = isDonated ? donor : '';
        book.remarks = remarks;

        this.saveBooks();
        this.renderBooks();
        this.showToast('✅ 图书信息更新成功！');
    }

    cancelEdit(id, originalContent) {
        const bookElement = document.getElementById(`book-${id}`);
        bookElement.innerHTML = originalContent;
    }

    deleteBook(id) {
        if (confirm('确定要删除这本图书吗？')) {
            this.books = this.books.filter(book => book.id !== id);
            this.saveBooks();
            this.renderBooks();
            this.showToast('🗑️ 图书删除成功！');
        }
    }

    filterBooks(searchTerm) {
        const filteredBooks = searchTerm ? 
            this.books.filter(book => 
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.donor.toLowerCase().includes(searchTerm.toLowerCase())
            ) : this.books;
        
        this.renderBooks(filteredBooks);
    }

    exportToExcel(type = 'all') {
        let booksToExport;
        let fileName;

        if (type === 'donated') {
            booksToExport = this.books.filter(book => book.isDonated);
            fileName = `捐赠图书_${new Date().toLocaleDateString('zh-CN')}`;
            if (booksToExport.length === 0) {
                this.showToast('没有捐赠图书数据可导出！', 'error');
                return;
            }
            
            // 捐赠图书导出保持原样
            const worksheet = XLSX.utils.json_to_sheet(booksToExport.map(book => ({
                '书名': book.title,
                '作者': book.author,
                '分类': book.category || '未分类',
                '是否捐赠': book.isDonated ? '是' : '否',
                '捐赠人': book.donor,
                '备注': book.remarks,
                '添加时间': book.createdAt
            })));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, '捐赠图书');
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            
        } else {
            // 导出全部图书时，按照分类排序
            booksToExport = [...this.books].sort((a, b) => {
                // 将空分类排在最后
                if (!a.category && !b.category) return 0;
                if (!a.category) return 1;
                if (!b.category) return -1;
                return a.category.localeCompare(b.category);
            });
            fileName = `全部图书_${new Date().toLocaleDateString('zh-CN')}`;
            if (booksToExport.length === 0) {
                this.showToast('没有图书数据可导出！', 'error');
                return;
            }

            // 创建主工作表数据
            const worksheetData = booksToExport.map(book => ({
                '书名': book.title,
                '作者': book.author,
                '分类': book.category || '未分类',
                '是否捐赠': book.isDonated ? '是' : '否',
                '捐赠人': book.donor,
                '备注': book.remarks,
                '添加时间': book.createdAt
            }));

            // 计算分类汇总
            const categoryCounts = {};
            booksToExport.forEach(book => {
                const category = book.category || '未分类';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            // 创建汇总工作表数据
            const summaryData = Object.entries(categoryCounts).map(([category, count]) => ({
                '分类': category,
                '图书数量': count,
                '捐赠图书数量': booksToExport.filter(book => 
                    (book.category || '未分类') === category && book.isDonated
                ).length
            }));

            // 按分类名称排序汇总数据
            summaryData.sort((a, b) => a.分类.localeCompare(b.分类));

            // 创建Excel工作簿
            const workbook = XLSX.utils.book_new();
            
            // 添加主数据工作表
            const mainWorksheet = XLSX.utils.json_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(workbook, mainWorksheet, '图书明细');
            
            // 添加汇总工作表
            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '分类汇总');
            
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }

        this.showToast(`📊 ${type === 'donated' ? '捐赠' : '全部'}图书导出成功！`);
    }

    saveBooks() {
        localStorage.setItem('books', JSON.stringify(this.books));
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
        this.updateCategorySelect();
    }

    renderBooks(booksToRender = this.books) {
        const bookList = document.getElementById('bookList');
        
        if (booksToRender.length === 0) {
            bookList.innerHTML = '<div class="empty-state">📖 暂无图书数据</div>';
            return;
        }

        bookList.innerHTML = booksToRender.map(book => `
            <div class="book-item" id="book-${book.id}">
                <div class="book-header">
                    <div class="book-title">${this.escapeHtml(book.title)}</div>
                    <div>
                        <button class="edit-btn" onclick="bookManager.editBook('${book.id}')" style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); padding: 8px 16px; margin-right: 8px; font-size: 14px;">编辑</button>
                        <button class="delete-btn" onclick="bookManager.deleteBook('${book.id}')" style="padding: 8px 16px; font-size: 14px;">删除</button>
                    </div>
                </div>
                <div class="book-author">作者：${this.escapeHtml(book.author)}</div>
                <div class="book-details">
                    ${book.category ? `<div>分类：${this.escapeHtml(book.category)}</div>` : ''}
                    ${book.isDonated ? `<div style="color: #e53e3e; font-weight: bold;">📚 捐赠图书</div>` : ''}
                    ${book.donor ? `<div>捐赠人：${this.escapeHtml(book.donor)}</div>` : ''}
                    ${book.remarks ? `<div>备注：${this.escapeHtml(book.remarks)}</div>` : ''}
                    <div>添加时间：${book.createdAt}</div>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 分类管理功能
    openCategoryModal() {
        document.getElementById('categoryModal').classList.add('show');
        this.renderCategories();
    }

    closeModal() {
        document.getElementById('categoryModal').classList.remove('show');
    }

    addCategory() {
        const input = document.getElementById('newCategory');
        const category = input.value.trim();
        
        if (!category) {
            this.showToast('请输入分类名称！', 'error');
            return;
        }

        if (this.categories.includes(category)) {
            this.showToast('该分类已存在！', 'error');
            return;
        }

        this.categories.push(category);
        this.saveCategories();
        this.renderCategories(); // 重新渲染分类列表
        input.value = '';
        this.showToast('✅ 分类添加成功！');
    }

    removeCategory(category) {
        if (confirm(`确定要删除分类"${category}"吗？`)) {
            this.categories = this.categories.filter(c => c !== category);
            this.saveCategories();
            this.renderCategories(); // 重新渲染分类列表
            this.showToast('🗑️ 分类删除成功！');
        }
    }

    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = this.categories.map(category => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: #f7fafc; border-radius: 6px;">
                <span id="category-text-${this.escapeHtml(category)}">${this.escapeHtml(category)}</span>
                <div>
                    <button onclick="bookManager.editCategory('${this.escapeHtml(category)}')" 
                            style="background: #3182ce; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">
                        编辑
                    </button>
                    <button onclick="bookManager.removeCategory('${this.escapeHtml(category)}')" 
                            style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    editCategory(oldCategory) {
        const newCategory = prompt(`修改分类 "${oldCategory}" 的名称：`, oldCategory);
        
        if (newCategory === null) return; // 用户取消
        if (!newCategory.trim()) {
            this.showToast('分类名称不能为空！', 'error');
            return;
        }
        if (this.categories.includes(newCategory) && newCategory !== oldCategory) {
            this.showToast('该分类名称已存在！', 'error');
            return;
        }

        // 更新分类数组
        const index = this.categories.indexOf(oldCategory);
        if (index > -1) {
            this.categories[index] = newCategory;
            
            // 更新所有使用该分类的图书
            let updated = false;
            this.books.forEach(book => {
                if (book.category === oldCategory) {
                    book.category = newCategory;
                    updated = true;
                }
            });
            
            this.saveBooks();
            this.saveCategories();
            this.renderCategories(); // 重新渲染分类列表
            this.renderBooks(); // 重新渲染图书列表
            this.showToast('✅ 分类修改成功！');
        }
    }

    updateCategorySelect() {
        const select = document.getElementById('category');
        select.innerHTML = `
            <option value="">请选择分类</option>
            ${this.categories.map(category => `
                <option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>
            `).join('')}
        `;
    }

    // Toast 通知系统
    showToast(message, type = 'success') {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示toast
        setTimeout(() => toast.classList.add('show'), 100);

        // 3秒后自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 初始化图书管理系统
const bookManager = new BookManager();

// 初始化分类选择框
bookManager.updateCategorySelect();