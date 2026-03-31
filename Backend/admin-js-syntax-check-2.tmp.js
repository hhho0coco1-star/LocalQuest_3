        window.addEventListener('popstate', function() {
            loadAdminContent(buildAdminAjaxUrlFromLocation(window.location), null, { pushHistory: false });
        });

        $(document).ready(function() {
            initializeAdminTheme();
            loadAdminContent(buildAdminAjaxUrlFromLocation(window.location), null, { pushHistory: false });
        });
