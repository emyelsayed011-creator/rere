import { Injectable, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';

export type Lang = 'en' | 'ar';
const LANG_KEY = 'samsary.lang';

type Dict = Record<string, string>;

const EN: Dict = {
  // App / common
  'app.tagline': 'Buy, Sell & Rent',
  'common.anywhere': 'Anywhere',
  'common.loading': 'Loading…',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.send': 'Send',
  'common.search': 'Search',
  'common.open': 'Open',
  'common.all': 'All',
  'common.saved': 'Saved',
  'common.failed': 'Failed',
  'common.sale': 'For sale',
  'common.rent': 'For rent',
  'common.sell': 'Sell',
  'common.rentShort': 'Rent',
  'common.page': 'Page',
  'common.of': 'of',

  // Status
  'status.0': 'Pending',
  'status.1': 'Approved',
  'status.2': 'Rejected',
  'status.3': 'Sold',
  'status.4': 'Rented',

  // Navbar
  'nav.browse': 'Browse',
  'nav.myListings': 'My Listings',
  'nav.chat': 'Chat',
  'nav.admin': 'Admin',
  'nav.post': 'Post',
  'nav.profile': 'Profile',
  'nav.signOut': 'Sign out',
  'nav.signIn': 'Sign in',
  'nav.signUp': 'Sign up',
  'nav.notifications': 'Notifications',
  'nav.language': 'Language',

  // Home
  'home.heroTitle': 'Buy, Sell & Rent Property',
  'home.heroSubtitle': 'Post your property with photos and videos. Reach real people.',
  'home.realEstatePlatform': 'Real Estate Platform',
  'home.newListingAlert': 'New listing available!',
  'home.viewListing': 'View',
  'home.browse': 'Browse',
  'home.postListing': 'Post a listing',
  'home.categories': 'Categories',
  'home.latest': 'Latest listings',
  'home.empty': 'No listings yet. Be the first to post!',
  'home.statListings': 'Listings',
  'home.statLive': 'Real-time chat',
  'home.statSecure': 'Secure & moderated',
  'home.statSecureVal': '100%',

  // Listings
  'listings.mine': 'My listings',
  'listings.browse': 'Browse listings',
  'listings.new': 'New listing',
  'listings.searchPlaceholder': 'Search…',
  'listings.allCategories': 'All categories',
  'listings.empty': 'No listings',

  // Listing detail
  'detail.posted': 'Posted',
  'detail.seller': 'Seller',
  'detail.writeMessage': 'Write a message…',
  'detail.contactSeller': 'Contact seller',
  'detail.signInToContact': 'Sign in to contact',
  'detail.confirmDelete': 'Delete this listing?',

  // Listing form
  'form.editTitle': 'Edit listing',
  'form.newTitle': 'Post a new listing',
  'form.title': 'Title',
  'form.type': 'Listing type',
  'form.category': 'Category',
  'form.price': 'Price',
  'form.currency': 'Currency',
  'form.location': 'Location',
  'form.description': 'Description',
  'form.save': 'Save',
  'form.createContinue': 'Create & continue',
  'form.saveFailed': 'Failed to save.',
  'form.uploadMedia': 'Upload media (images, video up to 5 min)',
  'form.videoInfo': 'Videos are validated by Cloudinary; uploads longer than 5 minutes are rejected automatically.',
  'form.addImages': 'Photos',
  'form.multiImageHint': 'Select multiple photos at once',
  'form.videoHint': 'Max 5 minutes',
  'form.optional': 'optional',
  'form.locationRequired': 'Please pick a location on the map',
  'form.contactPhone': 'Contact Phone',
  'form.editPhone': 'Edit in profile',
  'form.phoneRequired': 'Add your phone in your profile first',
  'form.uploadedMedia': 'Uploaded media',
  'form.viewVideo': 'View',
  'form.addImage': 'Add image',
  'form.addVideo': 'Add video',
  'form.imageFailed': 'Image upload failed.',
  'form.videoFailed': 'Video upload failed.',
  'form.submitReview': 'Submit for review',

  // Auth
  'auth.forgotPassword': 'Forgot password',
  'auth.forgotSubtitle': 'We will send you a reset link.',
  'auth.forgotInstructions': 'Enter your email and we will send you a link to reset your password.',
  'auth.sendResetLink': 'Send reset link',
  'auth.resetEmailSent': 'Check your email for the reset link.',
  'auth.backToLogin': 'Back to sign in',
  'auth.resetPassword': 'Reset password',
  'auth.resetSubtitle': 'Enter your new password.',
  'auth.newPassword': 'New password',
  'auth.confirmPassword': 'Confirm password',
  'auth.passwordMismatch': 'Passwords do not match',
  'auth.passwordResetSuccess': 'Password reset successfully.',
  'auth.invalidResetLink': 'This reset link is invalid or has expired.',
  'auth.requestNewLink': 'Request a new link',
  'auth.confirmingEmail': 'Confirming your email…',
  'auth.emailConfirmed': 'Email confirmed!',
  'auth.emailConfirmedMsg': 'Your email has been verified. You can now sign in.',
  'auth.confirmFailed': 'Confirmation failed',
  'auth.registerSubtitle': 'Create your account to start listing.',
  'auth.phone': 'Phone Number',
  'auth.phoneInvalid': 'Enter a valid Egyptian number (e.g. 01006205467)',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.noAccount': 'No account?',
  'auth.createOne': 'Create one',
  'auth.signInFailed': 'Sign in failed.',
  'auth.createAccount': 'Create account',
  'auth.displayName': 'Display name',
  'auth.passwordHint': 'Min 8 chars, uppercase, digit, symbol.',
  'auth.haveAccount': 'Have an account?',
  'auth.registerFailed': 'Registration failed.',

  // Profile
  'profile.title': 'My profile',
  'profile.changeAvatar': 'Change avatar',
  'profile.avatarUpdated': 'Avatar updated',
  'profile.uploadFailed': 'Upload failed',
  'profile.details': 'Details',
  'profile.displayName': 'Display name',
  'profile.phoneNumber': 'Phone number',
  'profile.bio': 'Bio',
  'profile.changePassword': 'Change password',
  'profile.currentPassword': 'Current password',
  'profile.newPassword': 'New password (min 8)',
  'profile.updatePassword': 'Update password',
  'profile.passwordChanged': 'Password changed.',

  // Chat
  'chat.noConversations': 'No conversations yet.',
  'chat.sayHello': 'Say hello!',
  'chat.typeMessage': 'Type a message…',
  'chat.selectConversation': 'Select a conversation',

  // Notifications
  'notif.title': 'Notifications',
  'notif.markAll': 'Mark all read',
  'notif.empty': 'No notifications',

  // Admin
  'admin.ads': 'Advertisements',
  'admin.reviews': 'Reviews',
  'admin.moderate': 'Moderate listings',
  'admin.users': 'Users',
  'admin.logs': 'System logs',
  'admin.users.count': 'Users',
  'admin.blocked': 'Blocked',
  'admin.listings': 'Listings',
  'admin.pending': 'Pending',
  'admin.approved': 'Approved',
  'admin.rejected': 'Rejected',
  'admin.messages': 'Messages',
  'admin.notifications': 'Notifications',
  'admin.pendingListings': 'Pending listings',
  'admin.approve': 'Approve',
  'admin.reject': 'Reject',
  'admin.reason': 'Reason',
  'admin.confirmReject': 'Confirm reject',
  'admin.nothingPending': 'Nothing pending.',
  'admin.colEmail': 'Email',
  'admin.colDisplay': 'Display',
  'admin.colJoined': 'Joined',
  'admin.colStatus': 'Status',
  'admin.colActions': 'Actions',
  'admin.active': 'Active',
  'admin.block': 'Block',
  'admin.unblock': 'Unblock',
  'admin.messageUser': 'Message',
  'admin.writeMessage': 'Write a message…',
  'admin.sent': 'Sent.',
  'admin.allLevels': 'All levels',
  'admin.info': 'Info',
  'admin.warning': 'Warning',
  'admin.error': 'Error',
  'admin.colTime': 'Time',
  'admin.colLevel': 'Level',
  'admin.colMethod': 'Method',
  'admin.colPath': 'Path',
  'admin.colStatusCode': 'Status',
  'admin.colUser': 'User',
  'admin.colIp': 'IP',
  'admin.colMessage': 'Message',
  'admin.noLogs': 'No logs',

  // Moderators
  'admin.moderators': 'Moderators',
  'admin.moderatorsDesc': 'Grant trusted users limited admin access.',
  'admin.addModerator': 'Add moderator',
  'admin.modUserSearch': 'User',
  'admin.modSearchPlaceholder': 'Search by email…',
  'admin.modPermissions': 'Permissions',
  'admin.noModerators': 'No moderators yet.',
  'admin.modUser': 'User',
  'admin.modCreatedAt': 'Added',
  'admin.editPermissions': 'Edit permissions',
  'admin.permManageListings': 'Manage listings',
  'admin.permManageUsers': 'Manage users',
  'admin.permManageReviews': 'Manage reviews',
  'admin.permViewLogs': 'View logs',
  'admin.permManageAds': 'Manage ads',
  'common.actions': 'Actions',

  // Form extras
  'form.locationPlaceholder': 'e.g. Cairo, Nasr City',
  'form.detectLocation': 'Detect my location',
  'auth.signInToContinue': 'Sign in to your account to continue.',
  'auth.emailPlaceholder': 'your@email.com',
  'auth.passwordPlaceholder': 'Min. 8 characters',

  // Admin theme
  'admin.theme': 'Branding & Theme',
  'admin.themeSiteName': 'Site Name',
  'admin.themeLogoUrl': 'Logo URL',
  'admin.themeLogoHint': 'Paste a direct image URL (PNG/SVG recommended)',
  'admin.themePrimary': 'Primary Color',
  'admin.themeAccent': 'Accent / Gold Color',
  'admin.themeFont': 'Font Family',
  'admin.themeFontSize': 'Base Font Size',
  'admin.themePreview': 'Preview',

  // Map
  'form.pickOnMap': 'Pick on map',
  'form.mapHint': 'Click the map to set the location, or drag the marker.',
  'form.next': 'Next',
  'form.back': 'Back',
  'form.createdOk': 'Listing created successfully',
  'auth.welcomeBack': 'Welcome back!',
  'auth.emailInvalid': 'Enter a valid email address',

  // Admin users - ban
  'admin.banReason': 'Reason',
  'admin.banReasonPlaceholder': 'Describe why this account is being suspended…',
  'admin.banReasonHint': 'This reason will be shown to the user in their notification.',
  'admin.banDuration': 'Duration',
  'admin.banPermanent': 'Permanent ban',
  'admin.hour': 'hour',
  'admin.hours': 'hours',
  'admin.days': 'days',
  'admin.unbanConfirm': 'Lift the suspension for',
  'admin.dashboard': 'Dashboard',

  // Admin moderators - new user
  'admin.modPickExisting': 'Pick existing user',
  'admin.modCreateNew': 'Create new account',

  // Ads
  'ad.sponsored': 'Sponsored',
  'ad.featuredListing': 'Featured',
  'ad.viewListing': 'View listing',
  'ad.learnMore': 'Learn more',
  'ad.advertiseWithUs': 'Advertise your listing here',

  // Upload
  'form.uploadAll': 'Upload images',
};

const AR: Dict = {
  // App / common
  'app.tagline': 'بيع، شراء وإيجار',
  'common.anywhere': 'أي مكان',
  'common.loading': 'جارٍ التحميل…',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.send': 'إرسال',
  'common.search': 'بحث',
  'common.open': 'فتح',
  'common.all': 'الكل',
  'common.saved': 'تم الحفظ',
  'common.failed': 'فشل',
  'common.sale': 'للبيع',
  'common.rent': 'للإيجار',
  'common.sell': 'بيع',
  'common.rentShort': 'إيجار',
  'common.page': 'صفحة',
  'common.of': 'من',

  // Status
  'status.0': 'قيد المراجعة',
  'status.1': 'مقبول',
  'status.2': 'مرفوض',
  'status.3': 'تم البيع',
  'status.4': 'تم التأجير',

  // Navbar
  'nav.browse': 'تصفح',
  'nav.myListings': 'إعلاناتي',
  'nav.chat': 'المحادثات',
  'nav.admin': 'الإدارة',
  'nav.post': 'أضف إعلان',
  'nav.profile': 'الملف الشخصي',
  'nav.signOut': 'تسجيل الخروج',
  'nav.signIn': 'تسجيل الدخول',
  'nav.signUp': 'إنشاء حساب',
  'nav.notifications': 'الإشعارات',
  'nav.language': 'اللغة',

  // Home
  'home.heroTitle': 'بيع، شراء وإيجار عقارات',
  'home.heroSubtitle': 'انشر عقارك بالصور والفيديو. تواصل مع أشخاص حقيقيين.',
  'home.realEstatePlatform': 'منصة عقارية',
  'home.newListingAlert': 'إعلان جديد!',
  'home.viewListing': 'عرض',
  'home.browse': 'تصفح',
  'home.postListing': 'أضف إعلاناً',
  'home.categories': 'الفئات',
  'home.latest': 'أحدث الإعلانات',
  'home.empty': 'لا توجد إعلانات بعد. كن أول من ينشر!',
  'home.statListings': 'إعلانات',
  'home.statLive': 'محادثة فورية',
  'home.statSecure': 'آمن ومُراقَب',
  'home.statSecureVal': '100%',

  // Listings
  'listings.mine': 'إعلاناتي',
  'listings.browse': 'تصفح الإعلانات',
  'listings.new': 'إعلان جديد',
  'listings.searchPlaceholder': 'ابحث…',
  'listings.allCategories': 'كل الفئات',
  'listings.empty': 'لا توجد إعلانات',

  // Listing detail
  'detail.posted': 'نُشر',
  'detail.seller': 'البائع',
  'detail.writeMessage': 'اكتب رسالة…',
  'detail.contactSeller': 'تواصل مع البائع',
  'detail.signInToContact': 'سجّل الدخول للتواصل',
  'detail.confirmDelete': 'حذف هذا الإعلان؟',

  // Listing form
  'form.editTitle': 'تعديل الإعلان',
  'form.newTitle': 'أضف إعلاناً جديداً',
  'form.title': 'العنوان',
  'form.type': 'نوع الإعلان',
  'form.category': 'الفئة',
  'form.price': 'السعر',
  'form.currency': 'العملة',
  'form.location': 'الموقع',
  'form.description': 'الوصف',
  'form.save': 'حفظ',
  'form.createContinue': 'إنشاء ومتابعة',
  'form.saveFailed': 'فشل الحفظ.',
  'form.uploadMedia': 'رفع الوسائط (صور، فيديو حتى ٥ دقائق)',
  'form.videoInfo': 'يتم التحقق من الفيديوهات عبر Cloudinary؛ يُرفض ما يزيد عن ٥ دقائق تلقائياً.',
  'form.addImages': 'صور',
  'form.multiImageHint': 'يمكنك اختيار عدة صور معاً',
  'form.videoHint': 'حد أقصى 5 دقائق',
  'form.optional': 'اختياري',
  'form.locationRequired': 'يرجى تحديد الموقع من الخريطة',
  'form.contactPhone': 'هاتف التواصل',
  'form.editPhone': 'تعديل في الملف الشخصي',
  'form.phoneRequired': 'أضف رقم هاتفك في ملفك الشخصي أولاً',
  'form.uploadedMedia': 'الوسائط المرفوعة',
  'form.viewVideo': 'عرض',
  'form.addImage': 'أضف صورة',
  'form.addVideo': 'أضف فيديو',
  'form.imageFailed': 'فشل رفع الصورة.',
  'form.videoFailed': 'فشل رفع الفيديو.',
  'form.submitReview': 'إرسال للمراجعة',

  // Auth
  'auth.forgotPassword': 'نسيت كلمة المرور',
  'auth.forgotSubtitle': 'سنرسل لك رابط إعادة التعيين.',
  'auth.forgotInstructions': 'أدخل بريدك وسنرسل لك رابط لإعادة تعيين كلمة المرور.',
  'auth.sendResetLink': 'إرسال رابط الإعادة',
  'auth.resetEmailSent': 'تحقق من بريدك للحصول على رابط الإعادة.',
  'auth.backToLogin': 'عودة لتسجيل الدخول',
  'auth.resetPassword': 'إعادة تعيين كلمة المرور',
  'auth.resetSubtitle': 'أدخل كلمة مرورك الجديدة.',
  'auth.newPassword': 'كلمة مرور جديدة',
  'auth.confirmPassword': 'تأكيد كلمة المرور',
  'auth.passwordMismatch': 'كلمتا المرور غير متطابقتين',
  'auth.passwordResetSuccess': 'تم إعادة تعيين كلمة المرور بنجاح.',
  'auth.invalidResetLink': 'رابط الإعادة غير صالح أو منتهي الصلاحية.',
  'auth.requestNewLink': 'طلب رابط جديد',
  'auth.confirmingEmail': 'جاري تأكيد بريدك…',
  'auth.emailConfirmed': 'تم تأكيد البريد!',
  'auth.emailConfirmedMsg': 'تم التحقق من بريدك. يمكنك الآن تسجيل الدخول.',
  'auth.confirmFailed': 'فشل التأكيد',
  'auth.registerSubtitle': 'أنشئ حسابك للبدء في النشر.',
  'auth.phone': 'رقم الهاتف',
  'auth.phoneInvalid': 'أدخل رقم مصري صحيح (مثال: 01006205467)',
  'auth.email': 'البريد الإلكتروني',
  'auth.password': 'كلمة المرور',
  'auth.signIn': 'تسجيل الدخول',
  'auth.noAccount': 'لا تملك حساباً؟',
  'auth.createOne': 'أنشئ حساباً',
  'auth.signInFailed': 'فشل تسجيل الدخول.',
  'auth.createAccount': 'إنشاء حساب',
  'auth.displayName': 'الاسم الظاهر',
  'auth.passwordHint': '٨ أحرف على الأقل، حرف كبير، رقم، ورمز.',
  'auth.haveAccount': 'لديك حساب؟',
  'auth.registerFailed': 'فشل التسجيل.',

  // Profile
  'profile.title': 'ملفي الشخصي',
  'profile.changeAvatar': 'تغيير الصورة',
  'profile.avatarUpdated': 'تم تحديث الصورة',
  'profile.uploadFailed': 'فشل الرفع',
  'profile.details': 'التفاصيل',
  'profile.displayName': 'الاسم الظاهر',
  'profile.phoneNumber': 'رقم الهاتف',
  'profile.bio': 'نبذة',
  'profile.changePassword': 'تغيير كلمة المرور',
  'profile.currentPassword': 'كلمة المرور الحالية',
  'profile.newPassword': 'كلمة مرور جديدة (٨ أحرف على الأقل)',
  'profile.updatePassword': 'تحديث كلمة المرور',
  'profile.passwordChanged': 'تم تغيير كلمة المرور.',

  // Chat
  'chat.noConversations': 'لا توجد محادثات بعد.',
  'chat.sayHello': 'ابدأ بالتحية!',
  'chat.typeMessage': 'اكتب رسالة…',
  'chat.selectConversation': 'اختر محادثة',

  // Notifications
  'notif.title': 'الإشعارات',
  'notif.markAll': 'تعليم الكل كمقروء',
  'notif.empty': 'لا توجد إشعارات',

  // Admin
  'admin.ads': 'الإعلانات المدفوعة',
  'admin.reviews': 'التقييمات',
  'admin.moderate': 'مراجعة الإعلانات',
  'admin.users': 'المستخدمون',
  'admin.logs': 'سجلات النظام',
  'admin.users.count': 'المستخدمون',
  'admin.blocked': 'محظور',
  'admin.listings': 'الإعلانات',
  'admin.pending': 'قيد المراجعة',
  'admin.approved': 'مقبول',
  'admin.rejected': 'مرفوض',
  'admin.messages': 'الرسائل',
  'admin.notifications': 'الإشعارات',
  'admin.pendingListings': 'إعلانات قيد المراجعة',
  'admin.approve': 'قبول',
  'admin.reject': 'رفض',
  'admin.reason': 'السبب',
  'admin.confirmReject': 'تأكيد الرفض',
  'admin.nothingPending': 'لا يوجد شيء قيد المراجعة.',
  'admin.colEmail': 'البريد',
  'admin.colDisplay': 'الاسم',
  'admin.colJoined': 'تاريخ الانضمام',
  'admin.colStatus': 'الحالة',
  'admin.colActions': 'إجراءات',
  'admin.active': 'نشط',
  'admin.block': 'حظر',
  'admin.unblock': 'إلغاء الحظر',
  'admin.messageUser': 'رسالة',
  'admin.writeMessage': 'اكتب رسالة…',
  'admin.sent': 'تم الإرسال.',
  'admin.allLevels': 'كل المستويات',
  'admin.info': 'معلومة',
  'admin.warning': 'تحذير',
  'admin.error': 'خطأ',
  'admin.colTime': 'الوقت',
  'admin.colLevel': 'المستوى',
  'admin.colMethod': 'الطريقة',
  'admin.colPath': 'المسار',
  'admin.colStatusCode': 'الحالة',
  'admin.colUser': 'المستخدم',
  'admin.colIp': 'IP',
  'admin.colMessage': 'الرسالة',
  'admin.noLogs': 'لا توجد سجلات',

  // Moderators
  'admin.moderators': 'المشرفون',
  'admin.moderatorsDesc': 'امنح مستخدمين موثوقين صلاحيات إدارية محدودة.',
  'admin.addModerator': 'إضافة مشرف',
  'admin.modUserSearch': 'المستخدم',
  'admin.modSearchPlaceholder': 'ابحث بالبريد…',
  'admin.modPermissions': 'الصلاحيات',
  'admin.noModerators': 'لا يوجد مشرفون بعد.',
  'admin.modUser': 'المستخدم',
  'admin.modCreatedAt': 'تاريخ الإضافة',
  'admin.editPermissions': 'تعديل الصلاحيات',
  'admin.permManageListings': 'إدارة الإعلانات',
  'admin.permManageUsers': 'إدارة المستخدمين',
  'admin.permManageReviews': 'إدارة التقييمات',
  'admin.permViewLogs': 'عرض السجلات',
  'admin.permManageAds': 'إدارة الإعلانات المدفوعة',
  'common.actions': 'إجراءات',

  // Form extras
  'form.locationPlaceholder': 'مثال: القاهرة، مدينة نصر',
  'form.detectLocation': 'تحديد موقعي',
  'auth.signInToContinue': 'سجّل دخولك للمتابعة.',
  'auth.emailPlaceholder': 'your@email.com',
  'auth.passwordPlaceholder': 'بحد أدناه ٨ أحرف',

  // Admin theme
  'admin.theme': 'الهوية البصرية',
  'admin.themeSiteName': 'اسم المنصة',
  'admin.themeLogoUrl': 'رابط الشعار',
  'admin.themeLogoHint': 'الصق رابط صورة مباشر (PNG/SVG مفضّل)',
  'admin.themePrimary': 'اللون الرئيسي',
  'admin.themeAccent': 'لون التمييز / الذهبي',
  'admin.themeFont': 'الخط',
  'admin.themeFontSize': 'حجم الخط الأساسي',
  'admin.themePreview': 'معاينة',

  // Map
  'form.pickOnMap': 'اختر من الخريطة',
  'form.mapHint': 'اضغط على الخريطة لتحديد الموقع أو اسحب العلامة.',
  'form.next': 'التالي',
  'form.back': 'السابق',
  'form.createdOk': 'تم إنشاء الإعلان بنجاح',
  'auth.welcomeBack': 'مرحباً بعودتك!',
  'auth.emailInvalid': 'أدخل بريداً إلكترونياً صحيحاً',

  // Admin users - ban
  'admin.banReason': 'السبب',
  'admin.banReasonPlaceholder': 'اشرح سبب إيقاف هذا الحساب…',
  'admin.banReasonHint': 'سيظهر هذا السبب للمستخدم في إشعاره.',
  'admin.banDuration': 'المدة',
  'admin.banPermanent': 'حظر دائم',
  'admin.hour': 'ساعة',
  'admin.hours': 'ساعات',
  'admin.days': 'أيام',
  'admin.unbanConfirm': 'رفع الإيقاف عن',
  'admin.dashboard': 'لوحة التحكم',

  // Admin moderators - new user
  'admin.modPickExisting': 'اختر مستخدماً',
  'admin.modCreateNew': 'إنشاء حساب جديد',

  // Ads
  'ad.sponsored': 'إعلان ممول',
  'ad.featuredListing': 'إعلان مميز',
  'ad.viewListing': 'عرض الإعلان',
  'ad.learnMore': 'اعرف أكثر',
  'ad.advertiseWithUs': 'أعلن معنا هنا',

  // Upload
  'form.uploadAll': 'رفع الصور',
};

const DICTS: Record<Lang, Dict> = { en: EN, ar: AR };

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initialLang());
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  readonly isRtl = computed(() => this.lang() === 'ar');

  constructor() {
    this.apply(this.lang());
  }

  private initialLang(): Lang {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === 'en' || saved === 'ar') return saved;
    return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }

  setLang(lang: Lang) {
    if (lang === this.lang()) return;
    this.lang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
    this.apply(lang);
  }

  toggle() {
    this.setLang(this.lang() === 'en' ? 'ar' : 'en');
  }

  private apply(lang: Lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  t(key: string, params?: Record<string, string | number>): string {
    const dict = DICTS[this.lang()];
    let value = dict[key] ?? DICTS.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }
    }
    return value;
  }
}

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);
  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
