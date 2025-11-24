/**
 * Main Application JavaScript
 * Handles user interactions, API calls, and data manipulation
 */

class JobSearchApp {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.allJobs = [];
        this.filteredJobs = [];
        this.currentSearchParams = {};
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search button
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        
        // Enter key in search inputs
        document.getElementById('jobQuery').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Sort and filter changes
        document.getElementById('sortBy').addEventListener('change', () => this.applyFiltersAndSort());
        document.getElementById('searchFilter').addEventListener('input', () => this.applyFiltersAndSort());
        
        // Salary inputs
        document.getElementById('salaryMin').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('salaryMax').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
    }

    async performSearch(page = 1) {
        const query = document.getElementById('jobQuery').value.trim();
        const location = document.getElementById('location').value;
        const salaryMin = document.getElementById('salaryMin').value;
        const salaryMax = document.getElementById('salaryMax').value;
        const sortBy = document.getElementById('sortBy').value;

        // Validate input
        if (!query) {
            this.showError('Please enter a job title or keywords to search.');
            return;
        }

        // Show loading state
        this.showLoading(true);
        this.hideError();
        this.hideResults();

        // Store search parameters
        this.currentSearchParams = { query, location, salaryMin, salaryMax, sortBy };

        try {
            // Build API URL
            const params = new URLSearchParams({
                q: query,
                location: location,
                page: page.toString()
            });

            if (salaryMin) params.append('salary_min', salaryMin);
            if (salaryMax) params.append('salary_max', salaryMax);
            if (sortBy && sortBy !== 'relevance') params.append('sort_by', sortBy);

            const response = await fetch(`/api/jobs/search?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.allJobs = data.jobs;
                this.currentPage = data.page;
                this.totalPages = data.totalPages;
                this.displayResults(data.jobs, data.totalResults);
                this.showFilters();
            } else {
                throw new Error('Failed to fetch jobs');
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showError(this.getErrorMessage(error));
            this.hideResults();
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(jobs, totalResults) {
        const container = document.getElementById('jobsContainer');
        const resultsHeader = document.getElementById('resultsHeader');
        const resultsCount = document.getElementById('resultsCount');
        const noResults = document.getElementById('noResults');

        // Clear previous results
        container.innerHTML = '';

        if (jobs.length === 0) {
            noResults.style.display = 'block';
            resultsHeader.style.display = 'none';
            return;
        }

        noResults.style.display = 'none';
        resultsHeader.style.display = 'flex';
        resultsCount.textContent = `Found ${totalResults.toLocaleString()} job${totalResults !== 1 ? 's' : ''}`;

        // Display jobs
        jobs.forEach(job => {
            const jobCard = this.createJobCard(job);
            container.appendChild(jobCard);
        });

        // Display pagination
        this.displayPagination();
    }

    createJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.dataset.jobId = job.id;

        // Format salary
        let salaryText = 'Salary not specified';
        let salaryClass = '';
        if (job.salary_min || job.salary_max) {
            const min = job.salary_min ? `$${job.salary_min.toLocaleString()}` : 'N/A';
            const max = job.salary_max ? `$${job.salary_max.toLocaleString()}` : 'N/A';
            salaryText = `${min} - ${max}`;
            salaryClass = job.salary_is_predicted ? 'predicted' : '';
        }

        // Format date
        const date = job.created ? new Date(job.created).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Date not available';

        card.innerHTML = `
            <div class="job-header">
                <div>
                    <h3 class="job-title">${this.escapeHtml(job.title)}</h3>
                    <div class="job-company">${this.escapeHtml(job.company)}</div>
                    <div class="job-location">📍 ${this.escapeHtml(job.location)}</div>
                </div>
                <div class="job-salary ${salaryClass}">${salaryText}</div>
            </div>
            <div class="job-description">${this.escapeHtml(job.description)}</div>
            <div class="job-footer">
                <div>
                    <span class="job-category">${this.escapeHtml(job.category)}</span>
                    <span class="job-date" style="margin-left: 1rem;">Posted: ${date}</span>
                </div>
                <a href="${job.redirect_url}" target="_blank" rel="noopener noreferrer" class="job-link">
                    View Job →
                </a>
            </div>
        `;

        return card;
    }

    applyFiltersAndSort() {
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase().trim();
        const sortBy = document.getElementById('sortBy').value;

        // Filter jobs
        let filtered = [...this.allJobs];

        if (searchFilter) {
            filtered = filtered.filter(job => {
                const searchableText = `${job.title} ${job.company} ${job.location} ${job.description} ${job.category}`.toLowerCase();
                return searchableText.includes(searchFilter);
            });
        }

        // Sort jobs
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.created || 0) - new Date(a.created || 0);
                case 'salary_desc':
                    const salaryA = a.salary_max || a.salary_min || 0;
                    const salaryB = b.salary_max || b.salary_min || 0;
                    return salaryB - salaryA;
                case 'salary_asc':
                    const salaryAMin = a.salary_min || a.salary_max || 0;
                    const salaryBMin = b.salary_min || b.salary_max || 0;
                    return salaryAMin - salaryBMin;
                case 'relevance':
                default:
                    return 0; // Keep original order
            }
        });

        // Update display
        this.filteredJobs = filtered;
        this.displayFilteredResults(filtered);
    }

    displayFilteredResults(jobs) {
        const container = document.getElementById('jobsContainer');
        const allCards = container.querySelectorAll('.job-card');

        if (jobs.length === 0) {
            allCards.forEach(card => card.classList.add('hidden'));
            document.getElementById('noResults').style.display = 'block';
            document.getElementById('resultsHeader').style.display = 'none';
            return;
        }

        document.getElementById('noResults').style.display = 'none';
        document.getElementById('resultsHeader').style.display = 'flex';

        // Show/hide cards based on filter
        const jobIds = new Set(jobs.map(job => job.id));
        allCards.forEach(card => {
            if (jobIds.has(card.dataset.jobId)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        // Update results count
        const visibleCount = jobs.length;
        document.getElementById('resultsCount').textContent = 
            `Showing ${visibleCount} of ${this.allJobs.length} job${this.allJobs.length !== 1 ? 's' : ''}`;
    }

    displayPagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (this.totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.performSearch(this.currentPage - 1);
            }
        });
        pagination.appendChild(prevBtn);

        // Page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage < maxPagesToShow - 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.addEventListener('click', () => this.performSearch(1));
            pagination.appendChild(firstBtn);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem';
                pagination.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === this.currentPage);
            pageBtn.addEventListener('click', () => this.performSearch(i));
            pagination.appendChild(pageBtn);
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0.5rem';
                pagination.appendChild(ellipsis);
            }

            const lastBtn = document.createElement('button');
            lastBtn.textContent = this.totalPages;
            lastBtn.addEventListener('click', () => this.performSearch(this.totalPages));
            pagination.appendChild(lastBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.performSearch(this.currentPage + 1);
            }
        });
        pagination.appendChild(nextBtn);
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('searchBtn').disabled = show;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    hideResults() {
        document.getElementById('jobsContainer').innerHTML = '';
        document.getElementById('resultsHeader').style.display = 'none';
        document.getElementById('noResults').style.display = 'none';
        document.getElementById('filtersSection').style.display = 'none';
    }

    showFilters() {
        document.getElementById('filtersSection').style.display = 'block';
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
            return 'The request took too long to complete. Please try again.';
        } else if (error.message.includes('Rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        } else {
            return error.message || 'An unexpected error occurred. Please try again.';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JobSearchApp();
});

