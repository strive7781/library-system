// 批量添加300本测试图书的脚本
function addTestBooks() {
    console.log('测试按钮被点击');
    
    // 检查全局对象
    console.log('window对象:', window);
    console.log('bookManager in window:', window.bookManager);
    console.log('typeof bookManager:', typeof bookManager);
    
    // 检查bookManager是否已初始化
    if (typeof bookManager === 'undefined') {
        console.error('错误: bookManager未定义');
        alert('错误: 图书管理系统未正确初始化');
        return;
    }
    
    if (!window.bookManager) {
        console.error('错误: window.bookManager不存在');
        alert('错误: 图书管理系统实例不存在');
        return;
    }
    
    console.log('bookManager对象:', bookManager);
    console.log('books数组:', bookManager.books);
    
    // 检查bookManager的方法是否存在
    if (typeof bookManager.saveBooks !== 'function') {
        console.error('错误: saveBooks方法不存在');
        alert('错误: 图书管理系统方法缺失');
        return;
    }
    
    if (typeof bookManager.renderBooks !== 'function') {
        console.error('错误: renderBooks方法不存在');
        alert('错误: 图书管理系统方法缺失');
        return;
    }
    
    const categories = ['文学', '科技', '历史', '艺术', '教育', '其他'];
    const authors = ['鲁迅', '老舍', '巴金', '茅盾', '冰心', '朱自清', '钱钟书', '沈从文', '张爱玲', '三毛'];
    const donors = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
    
    let addedCount = 0;
    const totalBooks = 300;
    
    function addNextBook() {
        if (addedCount >= totalBooks) {
            console.log('✅ 已完成添加300本测试图书');
            alert('✅ 已完成添加300本测试图书');
            
            // 最后保存并重新渲染
            bookManager.saveBooks();
            bookManager.renderBooks();
            return;
        }
        
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
        const randomDonor = donors[Math.floor(Math.random() * donors.length)];
        const isDonated = Math.random() > 0.7; // 30%的概率是捐赠图书
        
        const book = {
            id: Date.now().toString() + addedCount,
            title: `测试图书${addedCount + 1}`,
            author: randomAuthor,
            category: randomCategory,
            isDonated: isDonated,
            donor: isDonated ? randomDonor : '',
            remarks: `这是第${addedCount + 1}本测试图书，用于性能测试`,
            createdAt: new Date().toLocaleString('zh-CN')
        };
        
        bookManager.books.unshift(book);
        addedCount++;
        
        // 每添加50本书保存一次，避免频繁操作localStorage
        if (addedCount % 50 === 0) {
            bookManager.saveBooks();
            bookManager.renderBooks(); // 更新显示
            console.log(`已添加 ${addedCount} 本图书...`);
        }
        
        // 使用setTimeout避免阻塞UI
        setTimeout(addNextBook, 10);
    }
    
    console.log('开始添加300本测试图书...');
    alert('开始添加300本测试图书，请保持页面打开...');
    addNextBook();
}