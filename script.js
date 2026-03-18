const EXCHANGE_RATE = 10;
const REG_FEE_USD = 10;
const REG_FEE_GHS = 100;
const MIN_PRODUCT_VALUE = 20;
let selectedPlan = null;
let selectedCountry = null;
let customProductValue = 40;
let currentRegStep = 1;
let isPlanDropdownOpen = false;
let isCountryDropdownOpen = false;

const quotes = [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Your network is your net worth.", author: "Porter Gale" },
    { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" }
];

const plans = [
    { id: 1, name: "Starter Pack", price: 20 },
    { id: 2, name: "Chairman Pack", price: 40, recommended: true },
    { id: 3, name: "Director Pack", price: 80 },
    { id: 4, name: "Executive Pack", price: 240 },
    { id: 5, name: "Emperor Pack", price: 480 },
    { id: 6, name: "VIP Package", price: 1440 },
    { id: 7, name: "President Pack", price: 2880 }
];

const countries = ["Ghana", "Nigeria", "Kenya", "South Africa", "United States", "United Kingdom", "Canada", "Australia", "India", "China", "Germany", "France", "Japan", "Brazil", "Mexico"];

// Sidebar
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebarToggle').addEventListener('click', () => {
    if (window.innerWidth > 992) {
        sidebar.classList.toggle('collapsed');
    } else {
        sidebar.classList.toggle('mobile-open');
    }
});

function toggleMobileSidebar() {
    sidebar.classList.toggle('mobile-open');
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section-container').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.menu-link[onclick="showSection('${sectionId}')"]`);
    if (activeLink) activeLink.classList.add('active');
    if (window.innerWidth <= 992) sidebar.classList.remove('mobile-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Time Display
function updateGhanaTime() {
    const now = new Date();
    const utcTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const hours = String(utcTime.getUTCHours()).padStart(2, '0');
    const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
    document.getElementById('ghanaTime').textContent = `${hours}:${minutes}:`;
    document.getElementById('ghanaSeconds').textContent = seconds;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('ghanaDate').textContent = utcTime.toLocaleDateString('en-US', options);
}
setInterval(updateGhanaTime, 1000);
updateGhanaTime();

// Quote Rotation
let currentQuoteIndex = 0;
function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    quoteText.style.opacity = '0';
    quoteAuthor.style.opacity = '0';
    setTimeout(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        quoteText.textContent = `"${quotes[currentQuoteIndex].text}"`;
        quoteAuthor.textContent = `- ${quotes[currentQuoteIndex].author}`;
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
    }, 500);
}
setInterval(updateQuote, 60000);
updateQuote();

// Registration Functions
const planSelectTrigger = document.getElementById('planSelectTrigger');
const planDropdownOptions = document.getElementById('planDropdownOptions');
const planTriggerText = document.getElementById('planTriggerText');
const btnStep1 = document.getElementById('btnStep1');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const progressLineFill = document.getElementById('progressLineFill');
const countrySelectTrigger = document.getElementById('countrySelectTrigger');
const countryDropdownOptions = document.getElementById('countryDropdownOptions');
const countryTriggerText = document.getElementById('countryTriggerText');
const productValueUSDInput = document.getElementById('productValueUSD');
const productValueGHSDisplay = document.getElementById('productValueGHS');
const regFeeDisplay = document.getElementById('regFeeDisplay');
const totalPaymentGHSDisplay = document.getElementById('totalPaymentGHS');
const summaryProductValue = document.getElementById('summaryProductValue');
const summaryTotal = document.getElementById('summaryTotal');
const selectedPlanDisplay = document.getElementById('selectedPlanDisplay');

function initRegistration() {
    renderPlanDropdown();
    renderCountryDropdown();
    setupEventListeners();
    setupPasswordValidation();
    setupProductCalculator();
    updateProgress();
    updateCalculator();
}

function renderPlanDropdown() {
    planDropdownOptions.innerHTML = '';
    plans.forEach(plan => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.dataset.id = plan.id;
        let badgeHTML = plan.recommended ? '<span class="badge">Recommended</span>' : '';
        option.innerHTML = `<div class="option-left"><span class="option-name">${plan.name} ${badgeHTML}</span></div><span class="option-price">$${plan.price}</span>`;
        option.onclick = () => selectPlan(plan, option);
        planDropdownOptions.appendChild(option);
    });
}

function renderCountryDropdown() {
    countryDropdownOptions.innerHTML = '';
    countries.forEach(country => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.textContent = country;
        option.onclick = () => selectCountry(country, option);
        countryDropdownOptions.appendChild(option);
    });
}

function setupEventListeners() {
    planSelectTrigger.onclick = () => togglePlanDropdown();
    countrySelectTrigger.onclick = () => toggleCountryDropdown();
    document.addEventListener('click', (e) => {
        if (!planSelectTrigger.contains(e.target) && !planDropdownOptions.contains(e.target)) closePlanDropdown();
        if (!countrySelectTrigger.contains(e.target) && !countryDropdownOptions.contains(e.target)) closeCountryDropdown();
    });
}

function setupProductCalculator() {
    productValueUSDInput.addEventListener('input', () => {
        let value = parseFloat(productValueUSDInput.value);
        if (isNaN(value) || value < MIN_PRODUCT_VALUE) value = MIN_PRODUCT_VALUE;
        customProductValue = value;
        selectedPlan = null;
        updateCalculator();
        document.querySelectorAll('#planDropdownOptions .dropdown-option').forEach(opt => opt.classList.remove('selected'));
        planTriggerText.textContent = `Custom: $${value}`;
    });
}

function updateCalculator() {
    const productValueGHS = customProductValue * EXCHANGE_RATE;
    const totalPaymentGHS = productValueGHS + REG_FEE_GHS;
    productValueGHSDisplay.textContent = `₵${productValueGHS}`;
    totalPaymentGHSDisplay.textContent = `₵${totalPaymentGHS}`;
    summaryProductValue.textContent = `$${customProductValue} (₵${productValueGHS})`;
    summaryTotal.textContent = `₵${totalPaymentGHS}`;
    if (selectedPlan) {
        selectedPlanDisplay.textContent = `${selectedPlan.name} - $${selectedPlan.price} (₵${selectedPlan.price * EXCHANGE_RATE}) + ₵100 Registration = ₵${(selectedPlan.price * EXCHANGE_RATE) + REG_FEE_GHS}`;
    } else {
        selectedPlanDisplay.textContent = `Custom Plan - $${customProductValue} (₵${productValueGHS}) + ₵100 Registration = ₵${totalPaymentGHS}`;
    }
}

function togglePlanDropdown() {
    isPlanDropdownOpen = !isPlanDropdownOpen;
    if (isPlanDropdownOpen) { openPlanDropdown(); closeCountryDropdown(); } else { closePlanDropdown(); }
}

function openPlanDropdown() {
    planDropdownOptions.classList.add('show');
    planSelectTrigger.classList.add('active');
}

function closePlanDropdown() {
    planDropdownOptions.classList.remove('show');
    planSelectTrigger.classList.remove('active');
    isPlanDropdownOpen = false;
}

function toggleCountryDropdown() {
    isCountryDropdownOpen = !isCountryDropdownOpen;
    if (isCountryDropdownOpen) { openCountryDropdown(); closePlanDropdown(); } else { closeCountryDropdown(); }
}

function openCountryDropdown() {
    countryDropdownOptions.classList.add('show');
    countrySelectTrigger.classList.add('active');
}

function closeCountryDropdown() {
    countryDropdownOptions.classList.remove('show');
    countrySelectTrigger.classList.remove('active');
    isCountryDropdownOpen = false;
}

function selectPlan(plan, optionElement) {
    document.querySelectorAll('#planDropdownOptions .dropdown-option').forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');
    planTriggerText.textContent = plan.name;
    selectedPlan = plan;
    customProductValue = plan.price;
    productValueUSDInput.value = plan.price;
    updateCalculator();
    closePlanDropdown();
}

function selectCountry(country, optionElement) {
    document.querySelectorAll('#countryDropdownOptions .dropdown-option').forEach(opt => opt.classList.remove('selected'));
    optionElement.classList.add('selected');
    countryTriggerText.textContent = country;
    selectedCountry = country;
    closeCountryDropdown();
}

function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    passwordInput.addEventListener('input', () => { validatePassword(passwordInput.value); checkPasswordMatch(); });
    confirmPasswordInput.addEventListener('input', () => checkPasswordMatch());
}

function validatePassword(password) {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    updateRequirement('reqLength', hasLength);
    updateRequirement('reqNumber', hasNumber);
    updateRequirement('reqLetter', hasLetter);
    updateRequirement('reqSymbol', hasSymbol);
    const strength = calculatePasswordStrength(hasLength, hasNumber, hasLetter, hasSymbol);
    updateStrengthBar(strength);
}

function updateRequirement(id, isValid) {
    const element = document.getElementById(id);
    if (isValid) { element.classList.remove('invalid'); element.classList.add('valid'); }
    else { element.classList.remove('valid'); element.classList.add('invalid'); }
}

function calculatePasswordStrength(hasLength, hasNumber, hasLetter, hasSymbol) {
    let score = 0;
    if (hasLength) score++;
    if (hasNumber) score++;
    if (hasLetter) score++;
    if (hasSymbol) score++;
    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    return 'strong';
}

function updateStrengthBar(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    strengthFill.className = 'strength-fill';
    strengthFill.classList.add(strength);
    const strengthLabels = { 'weak': 'Weak - Add more characters', 'medium': 'Medium - Almost there', 'strong': 'Strong - Great password!' };
    strengthText.textContent = strengthLabels[strength];
}

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('confirmPasswordError');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPassword && password !== confirmPassword) {
        errorElement.classList.add('show');
        confirmPasswordInput.classList.add('error');
        return false;
    } else {
        errorElement.classList.remove('show');
        confirmPasswordInput.classList.remove('error');
        if (confirmPassword) confirmPasswordInput.classList.add('success');
        return true;
    }
}

function goToStep(step) {
    if (step === 2 && customProductValue < MIN_PRODUCT_VALUE) {
        showToast(`Minimum product value is $${MIN_PRODUCT_VALUE} (₵${MIN_PRODUCT_VALUE * 10})`, 'error');
        return;
    }
    if (step === 3) { if (!validateStep2()) return; updateReviewStep(); }
    if (step === 4) updateConfirmationStep();
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.style.display = 'block';
    }
    currentRegStep = step;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step > 1) showToast('Step Updated');
}

function validateStep2() {
    let isValid = true;
    const fields = [
        { id: 'username', errorId: 'usernameError', message: 'Username is required' },
        { id: 'firstName', errorId: 'firstNameError', message: 'First name is required' },
        { id: 'lastName', errorId: 'lastNameError', message: 'Last name is required' },
        { id: 'mobileNumber', errorId: 'mobileError', message: 'Valid mobile number is required' },
        { id: 'email', errorId: 'emailError', message: 'Valid email is required' }
    ];
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorElement = document.getElementById(field.errorId);
        if (!input.value.trim()) {
            errorElement.textContent = field.message;
            errorElement.classList.add('show');
            input.classList.add('error');
            isValid = false;
        } else {
            errorElement.classList.remove('show');
            input.classList.remove('error');
            input.classList.add('success');
        }
    });
    const email = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailRegex.test(email.value)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        email.classList.add('error');
        isValid = false;
    }
    const countryError = document.getElementById('countryError');
    if (!selectedCountry) {
        countryError.classList.add('show');
        countrySelectTrigger.classList.add('error');
        isValid = false;
    } else {
        countryError.classList.remove('show');
        countrySelectTrigger.classList.remove('error');
    }
    const password = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const passwordStrength = calculatePasswordStrength(password.value.length >= 8, /\d/.test(password.value), /[a-zA-Z]/.test(password.value), /[!@#$%^&*(),.?":{}|<>]/.test(password.value));
    if (passwordStrength !== 'strong') {
        passwordError.classList.add('show');
        password.classList.add('error');
        isValid = false;
    } else {
        passwordError.classList.remove('show');
        password.classList.remove('error');
        password.classList.add('success');
    }
    if (!checkPasswordMatch()) isValid = false;
    if (!isValid) showToast('Please fix the errors above', 'error');
    return isValid;
}

function validateAndContinue() { if (validateStep2()) goToStep(3); }

function updateProgress() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentRegStep) step.classList.add('completed');
        else if (index + 1 === currentRegStep) step.classList.add('active');
    });
    const progressPercentage = ((currentRegStep - 1) / 3) * 100;
    progressLineFill.style.width = `${progressPercentage}%`;
}

function updateReviewStep() {
    const productValueGHS = customProductValue * EXCHANGE_RATE;
    const totalPaymentGHS = productValueGHS + REG_FEE_GHS;
    const totalUSD = customProductValue + REG_FEE_USD;
    document.getElementById('reviewProductDetail').textContent = selectedPlan ? selectedPlan.name : 'Custom Plan';
    document.getElementById('reviewProductUSD').textContent = `$${customProductValue}`;
    document.getElementById('reviewProductGHS').textContent = `₵${productValueGHS}`;
    document.getElementById('reviewTotalUSD').textContent = `$${totalUSD}`;
    document.getElementById('reviewTotalGHS').textContent = `₵${totalPaymentGHS}`;
    document.getElementById('reviewProductsWorth').textContent = `$${customProductValue} (₵${productValueGHS})`;
    document.getElementById('reviewUsername').textContent = document.getElementById('username').value;
    document.getElementById('reviewName').textContent = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
    document.getElementById('reviewMobile').textContent = document.getElementById('mobileNumber').value;
    document.getElementById('reviewCountry').textContent = selectedCountry;
}

function updateConfirmationStep() {
    const productValueGHS = customProductValue * EXCHANGE_RATE;
    const totalPaymentGHS = productValueGHS + REG_FEE_GHS;
    document.getElementById('confirmUsername').textContent = document.getElementById('username').value;
    document.getElementById('confirmName').textContent = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
    document.getElementById('confirmEmail').textContent = document.getElementById('email').value;
    document.getElementById('confirmProduct').textContent = `$${customProductValue} (₵${productValueGHS})`;
    document.getElementById('confirmTotal').textContent = `₵${totalPaymentGHS}`;
}

function resetForm() {
    document.getElementById('registrationForm').reset();
    selectedPlan = null;
    selectedCountry = null;
    customProductValue = 40;
    currentRegStep = 1;
    productValueUSDInput.value = 40;
    planTriggerText.textContent = 'Select a plan...';
    countryTriggerText.textContent = 'Select country...';
    document.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('success', 'error'));
    document.querySelectorAll('.error-message').forEach(error => error.classList.remove('show'));
    document.getElementById('strengthFill').className = 'strength-fill';
    document.getElementById('strengthText').textContent = 'Password strength';
    updateCalculator();
    goToStep(1);
}

function showToast(message = 'Success', type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type === 'error' ? 'error' : ''} show`;
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Calculator Functions
function calculateReferral() {
    const pkg = parseFloat(document.getElementById('refPackage').value);
    if (!pkg) { document.getElementById('refResult').style.display = 'none'; return; }
    const commission = pkg * 0.25;
    const ghs = commission * EXCHANGE_RATE;
    document.getElementById('refResult').style.display = 'block';
    document.getElementById('refUSD').textContent = `$${commission.toFixed(2)}`;
    document.getElementById('refGHS').textContent = `₵${ghs.toFixed(2)}`;
}

function calculateUpgrade() {
    const current = parseFloat(document.getElementById('upCurrent').value);
    const next = parseFloat(document.getElementById('upNew').value);
    if (next <= current) { document.getElementById('upResult').style.display = 'none'; return; }
    const diff = next - current;
    const commission = diff * 0.25;
    const ghs = commission * EXCHANGE_RATE;
    document.getElementById('upResult').style.display = 'block';
    document.getElementById('upUSD').textContent = `$${commission.toFixed(2)}`;
    document.getElementById('upGHS').textContent = `₵${ghs.toFixed(2)}`;
    document.getElementById('upDiff').textContent = `$${diff}`;
}

function calculateMatching() {
    const left = parseFloat(document.getElementById('matchLeft').value) || 0;
    const right = parseFloat(document.getElementById('matchRight').value) || 0;
    const minBV = Math.min(left, right);
    if (minBV < 20) { document.getElementById('matchResult').style.display = 'none'; return; }
    const bonus = minBV * 0.15;
    const ghs = bonus * EXCHANGE_RATE;
    document.getElementById('matchResult').style.display = 'block';
    document.getElementById('matchUSD').textContent = `$${bonus.toFixed(2)}`;
    document.getElementById('matchGHS').textContent = `₵${ghs.toFixed(2)}`;
    document.getElementById('matchBase').textContent = minBV;
}

function calculatePurchase() {
    const amount = parseFloat(document.getElementById('purAmount').value);
    if (!amount) { document.getElementById('purResult').style.display = 'none'; return; }
    const rebate = amount * 0.20;
    const ghs = rebate * EXCHANGE_RATE;
    document.getElementById('purResult').style.display = 'block';
    document.getElementById('purUSD').textContent = `$${rebate.toFixed(2)}`;
    document.getElementById('purGHS').textContent = `₵${ghs.toFixed(2)}`;
}

function calculateMaintenance() {
    const amount = parseFloat(document.getElementById('maintAmount').value);
    if (!amount) { document.getElementById('maintResult').style.display = 'none'; return; }
    const bonus = amount * 0.04;
    const ghs = bonus * EXCHANGE_RATE;
    document.getElementById('maintResult').style.display = 'block';
    document.getElementById('maintUSD').textContent = `$${bonus.toFixed(2)}`;
    document.getElementById('maintGHS').textContent = `₵${ghs.toFixed(2)}`;
}

initRegistration();
