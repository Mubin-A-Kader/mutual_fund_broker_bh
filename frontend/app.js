class MutualFundApp {
    constructor() {
        // Check authentication first
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.currentPage = 1;
        this.fundsData = [];
        this.filteredData = [];
        
        // DOM Elements
        this.fundsContainer = document.querySelector('.funds-container');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.pageInfo = document.getElementById('pageInfo');
        this.searchInput = document.getElementById('searchInput');
        this.rtaFilter = document.getElementById('rtaFilter');

        // Event Listeners
        this.prevPageBtn.addEventListener('click', () => this.changePage(-1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(1));
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.rtaFilter.addEventListener('change', () => this.handleRTAFilter());

        // Initial load
        this.loadFunds();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    async loadFunds() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:8000/funds/schemes/${this.rtaFilter.value}?page=${this.currentPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }

            const data = await response.json();
            
            this.fundsData = data.data;
            this.filteredData = [...this.fundsData];
            this.renderFunds();
            this.updatePagination(data.pagination);
        } catch (error) {
            console.error('Error loading funds:', error);
            this.fundsContainer.innerHTML = '<p class="error">Error loading funds. Please try again later.</p>';
        }
    }

    renderFunds() {
        this.fundsContainer.innerHTML = this.filteredData
            .map(fund => `
                <div class="fund-card">
                    <h3>${fund.scheme_name}</h3>
                    <div class="fund-info">
                        <p><strong>NAV:</strong> ₹${fund.nav}</p>
                        <p><strong>Date:</strong> ${new Date(fund.date).toLocaleDateString()}</p>
                        <p><strong>Fund House:</strong> ${fund.fund_house}</p>
                    </div>
                </div>
            `)
            .join('');
    }

    updatePagination(paginationInfo) {
        this.pageInfo.textContent = `Page ${paginationInfo.current_page} of ${paginationInfo.total_pages}`;
        this.prevPageBtn.disabled = !paginationInfo.has_previous;
        this.nextPageBtn.disabled = !paginationInfo.has_next;
    }

    changePage(delta) {
        this.currentPage += delta;
        this.loadFunds();
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        this.filteredData = this.fundsData.filter(fund => 
            fund.scheme_name.toLowerCase().includes(searchTerm) ||
            fund.fund_house.toLowerCase().includes(searchTerm)
        );
        this.renderFunds();
    }

    handleRTAFilter() {
        this.currentPage = 1;
        this.loadFunds();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new MutualFundApp();
});