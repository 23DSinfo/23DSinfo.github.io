// 全局变量
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
let pageSize = 10;
let currentSortColumn = '排名';
let currentSortDirection = 'asc';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载CSV数据
    loadCSVData();
    
    // 绑定事件监听器
    bindEventListeners();
});

// 加载CSV数据
function loadCSVData() {
    Papa.parse('23DS.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            allStudents = results.data;
            // 过滤掉空行
            allStudents = allStudents.filter(student => student.学号);
            
            // 初始化筛选后的学生数据
            filteredStudents = [...allStudents];
            
            // 初始排序
            sortStudents(currentSortColumn, currentSortDirection);
            
            // 更新表格和图表
            updateTable();
            initCharts();
        },
        error: function(error) {
            console.error('Error loading CSV data:', error);
            alert('加载数据失败，请刷新页面重试。');
        }
    });
}

// 绑定事件监听器
function bindEventListeners() {
    // 搜索按钮点击事件
    document.getElementById('searchBtn').addEventListener('click', function() {
        searchStudents();
    });
    
    // 重置按钮点击事件
    document.getElementById('resetBtn').addEventListener('click', function() {
        resetFilters();
    });
    
    // 表头排序点击事件
    document.querySelectorAll('#studentTable th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            const direction = currentSortColumn === column && currentSortDirection === 'asc' ? 'desc' : 'asc';
            sortStudents(column, direction);
            updateTable();
        });
    });
    
    // 分页按钮点击事件
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredStudents.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });
    
    // 每页显示条数变化事件
    document.getElementById('pageSize').addEventListener('change', function() {
        pageSize = parseInt(this.value);
        currentPage = 1;
        updateTable();
    });
    
    // 筛选条件变化事件
    document.getElementById('majorFilter').addEventListener('change', applyFilters);
    document.getElementById('genderFilter').addEventListener('change', applyFilters);
    document.getElementById('financialFilter').addEventListener('change', applyFilters);
    document.getElementById('minGPA').addEventListener('input', applyFilters);
    document.getElementById('maxGPA').addEventListener('input', applyFilters);
    
    // 标签页切换事件
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有标签页的active类
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // 添加当前标签页的active类
            this.classList.add('active');
            document.getElementById(tabId + 'View').classList.add('active');
            
            // 如果切换到图表视图，更新图表
            if (tabId === 'charts') {
                updateCharts();
            }
        });
    });
    
    // 模态框关闭按钮点击事件
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('studentModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('studentModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 搜索学生
function searchStudents() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchType = document.getElementById('searchType').value;
    
    if (searchInput === '') {
        applyFilters();
        return;
    }
    
    filteredStudents = allStudents.filter(student => {
        const value = String(student[searchType] || '').toLowerCase();
        return value.includes(searchInput);
    });
    
    currentPage = 1;
    updateTable();
    updateCharts();
}

// 应用筛选条件
function applyFilters() {
    const majorFilter = document.getElementById('majorFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const financialFilter = document.getElementById('financialFilter').value;
    const minGPA = parseFloat(document.getElementById('minGPA').value) || 0;
    const maxGPA = parseFloat(document.getElementById('maxGPA').value) || 4;
    
    filteredStudents = allStudents.filter(student => {
        // 专业筛选
        if (majorFilter !== 'all' && student.专业 !== majorFilter) {
            return false;
        }
        
        // 性别筛选
        if (genderFilter !== 'all' && student.性别 !== genderFilter) {
            return false;
        }
        
        // 经济困难筛选
        if (financialFilter !== 'all' && student.是否经济困难 !== parseInt(financialFilter)) {
            return false;
        }
        
        // GPA范围筛选
        if (student.GPA < minGPA || student.GPA > maxGPA) {
            return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    updateTable();
    updateCharts();
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchType').selectedIndex = 0;
    document.getElementById('majorFilter').selectedIndex = 0;
    document.getElementById('genderFilter').selectedIndex = 0;
    document.getElementById('financialFilter').selectedIndex = 0;
    document.getElementById('minGPA').value = '';
    document.getElementById('maxGPA').value = '';
    
    filteredStudents = [...allStudents];
    currentPage = 1;
    updateTable();
    updateCharts();
}

// 排序学生数据
function sortStudents(column, direction) {
    currentSortColumn = column;
    currentSortDirection = direction;
    
    filteredStudents.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // 处理数字和字符串的排序
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
            valueA = String(valueA || '').toLowerCase();
            valueB = String(valueB || '').toLowerCase();
            return direction === 'asc' ? 
                valueA.localeCompare(valueB, 'zh-CN') : 
                valueB.localeCompare(valueA, 'zh-CN');
        }
    });
    
    // 更新表头排序图标
    document.querySelectorAll('#studentTable th[data-sort]').forEach(th => {
        const sortColumn = th.getAttribute('data-sort');
        const sortIcon = th.querySelector('.sort-icon');
        
        if (sortColumn === column) {
            sortIcon.textContent = direction === 'asc' ? '↑' : '↓';
        } else {
            sortIcon.textContent = '↕';
        }
    });
}

// 更新表格
function updateTable() {
    const tbody = document.querySelector('#studentTable tbody');
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
    
    if (filteredStudents.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="13" style="text-align: center;">没有找到匹配的学生信息</td>`;
        tbody.appendChild(tr);
    } else {
        for (let i = startIndex; i < endIndex; i++) {
            const student = filteredStudents[i];
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${student.学号 || ''}</td>
                <td>${student.姓名 || ''}</td>
                <td>${student.性别 || ''}</td>
                <td>${student.年龄 || ''}</td>
                <td>${student.生源地 || ''}</td>
                <td>${student.GPA || ''}</td>
                <td>${student.排名 || ''}/${student.专业总人数 || ''}</td>
                <td>${student.专业 || ''}</td>
                <td>${student.寝室号 || ''}</td>
                <td>${student.手机号 || ''}</td>
                <td>${student.心理风险等级 || '无'}</td>
                <td>${student.是否经济困难 ? '是' : '否'}</td>
                <td><button class="view-btn" data-id="${i}">查看</button></td>
            `;
            
            tbody.appendChild(tr);
        
        // 绑定查看按钮点击事件
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-id'));
                showStudentDetails(filteredStudents[index]);
            });
        });
    }
    
    // 更新分页信息
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    // 禁用/启用分页按钮
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

// 显示学生详细信息
function showStudentDetails(student) {
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>学生详细信息</h2>
        <div class="student-details">
            <p><strong>学号：</strong>${student.学号 || ''}</p>
            <p><strong>姓名：</strong>${student.姓名 || ''}</p>
            <p><strong>性别：</strong>${student.性别 || ''}</p>
            <p><strong>年龄：</strong>${student.年龄 || ''}</p>
            <p><strong>生源地：</strong>${student.生源地 || ''}</p>
            <p><strong>GPA：</strong>${student.GPA || ''}</p>
            <p><strong>排名：</strong>${student.排名 || ''}/${student.专业总人数 || ''}</p>
            <p><strong>专业：</strong>${student.专业 || ''}</p>
            <p><strong>寝室号：</strong>${student.寝室号 || ''}</p>
            <p><strong>手机号：</strong>${student.手机号 || ''}</p>
            <p><strong>经济困难：</strong>${student.是否经济困难 ? '是' : '否'}</p>
            <p><strong>心理风险等级：</strong>${student.心理风险等级 || '无'}</p>
            <p><strong>紧急联系人：</strong>${student.紧急联系人 || ''}</p>
            <p><strong>紧急联系人电话：</strong>${student.紧急联系人电话号码 || ''}</p>
        </div>
    `;
    document.getElementById('studentModal').style.display = 'block';
}

// 初始化图表
function initCharts() {
    // 创建GPA分布图表
    const gpaCtx = document.getElementById('gpaChart').getContext('2d');
    window.gpaChart = new Chart(gpaCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '学生数量',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // 创建专业分布图表
    const majorCtx = document.getElementById('majorChart').getContext('2d');
    window.majorChart = new Chart(majorCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    // 创建籍贯分布图表
    const hometownCtx = document.getElementById('hometownChart').getContext('2d');
    window.hometownChart = new Chart(hometownCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '学生数量',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // 创建性别比例图表
    const genderCtx = document.getElementById('genderChart').getContext('2d');
    window.genderChart = new Chart(genderCtx, {
        type: 'doughnut',
        data: {
            labels: ['男', '女'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    // 更新图表数据
    updateCharts();
}

// 更新图表数据
function updateCharts() {
    if (!window.gpaChart || !window.majorChart || !window.hometownChart || !window.genderChart) {
        return;
    }
    
    // 更新GPA分布图表
    const gpaRanges = ['1.0-1.5', '1.5-2.0', '2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0'];
    const gpaCounts = Array(gpaRanges.length).fill(0);
    
    filteredStudents.forEach(student => {
        const gpa = student.GPA;
        if (gpa >= 1.0 && gpa < 1.5) gpaCounts[0]++;
        else if (gpa >= 1.5 && gpa < 2.0) gpaCounts[1]++;
        else if (gpa >= 2.0 && gpa < 2.5) gpaCounts[2]++;
        else if (gpa >= 2.5 && gpa < 3.0) gpaCounts[3]++;
        else if (gpa >= 3.0 && gpa < 3.5) gpaCounts[4]++;
        else if (gpa >= 3.5 && gpa <= 4.0) gpaCounts[5]++;
    });
    
    window.gpaChart.data.labels = gpaRanges;
    window.gpaChart.data.datasets[0].data = gpaCounts;
    window.gpaChart.update();
    
    // 更新专业分布图表
    const majorCounts = {};
    filteredStudents.forEach(student => {
        const major = student.专业 || '未知';
        majorCounts[major] = (majorCounts[major] || 0) + 1;
    });
    
    window.majorChart.data.labels = Object.keys(majorCounts);
    window.majorChart.data.datasets[0].data = Object.values(majorCounts);
    window.majorChart.update();
    
    // 更新籍贯分布图表
    const hometownCounts = {};
    filteredStudents.forEach(student => {
        const hometown = student.生源地 || '未知';
        hometownCounts[hometown] = (hometownCounts[hometown] || 0) + 1;
    });
    
    // 只显示前10个籍贯
    const sortedHometowns = Object.entries(hometownCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    window.hometownChart.data.labels = sortedHometowns.map(item => item[0]);
    window.hometownChart.data.datasets[0].data = sortedHometowns.map(item => item[1]);
    window.hometownChart.update();
    
    // 更新性别比例图表
    const genderCounts = [0, 0]; // [男, 女]
    filteredStudents.forEach(student => {
        if (student.性别 === '男') {
            genderCounts[0]++;
        } else if (student.性别 === '女') {
            genderCounts[1]++;
        }
    });
    
    window.genderChart.data.datasets[0].data = genderCounts;
    window.genderChart.update();
    }
}

// 三、JavaScript增强

// 为了提升移动端体验，需要添加一些JavaScript功能：
// ```javascript
// 在现有代码的适当位置添加以下函数

// 为移动端表格添加标签
function setupMobileTableLabels() {
    // 获取表头文本
    const headerTexts = [];
    document.querySelectorAll('table th').forEach(th => {
        headerTexts.push(th.textContent.trim());
    });
    
    // 为每个表格单元格添加data属性
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headerTexts.length) {
                    // 设置伪元素内容
                    cell.setAttribute('data-label', headerTexts[index]);
                    
                    // 添加移动端样式
                    if (window.innerWidth <= 768) {
                        cell.style.paddingLeft = '50%';
                        cell.style.position = 'relative';
                        
                        // 创建标签元素
                        if (!cell.querySelector('.mobile-label')) {
                            const label = document.createElement('span');
                            label.className = 'mobile-label';
                            label.style.position = 'absolute';
                            label.style.left = '10px';
                            label.style.top = '10px';
                            label.style.fontWeight = 'bold';
                            label.style.textAlign = 'left';
                            label.textContent = headerTexts[index];
                            cell.insertBefore(label, cell.firstChild);
                        }
                    }
                }
            });
        });
    });
}

// 添加窗口大小变化监听
window.addEventListener('resize', function() {
    setupMobileTableLabels();
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 调用现有的初始化函数
    
    // 添加移动端表格标签
    setupMobileTableLabels();
    
    // 添加触摸滑动支持
    let startX;
    const tabsContainer = document.querySelector('.tabs');
    
    if (tabsContainer) {
        tabsContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });
        
        tabsContainer.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            const threshold = 50;
            
            if (Math.abs(diff) > threshold) {
                // 获取当前激活的标签
                const activeTab = document.querySelector('.tab-btn.active');
                if (!activeTab) return;
                
                const tabs = Array.from(document.querySelectorAll('.tab-btn'));
                const currentIndex = tabs.indexOf(activeTab);
                
                if (diff > 0 && currentIndex < tabs.length - 1) {
                    // 向左滑动，切换到下一个标签
                    tabs[currentIndex + 1].click();
                } else if (diff < 0 && currentIndex > 0) {
                    // 向右滑动，切换到上一个标签
                    tabs[currentIndex - 1].click();
                }
            }
        });
    }
});