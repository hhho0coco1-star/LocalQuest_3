package com.app.controller;

import java.util.Collections;
import java.util.NoSuchElementException;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.service.locationqr.LocationQrService;

@Controller
@RequestMapping("/admin/store-info")
public class AdminBusinessQrController {
    private static final String FRONTEND_BASE_URL_PARAM = "lq.frontend.base-url";

    @Autowired
    private LocationQrService locationQrService;

    @GetMapping("/qr")
    @ResponseBody
    public ResponseEntity<?> getBusinessQr(
        @RequestParam int businessId,
        HttpServletRequest request) {
        try {
            BusinessQrInfoDTO qrInfo = locationQrService.getOrCreateBusinessQrInfo(businessId);
            qrInfo.setVerifyUrl(
                locationQrService.buildQrVerifyUrl(resolveFrontendBaseUrl(request), qrInfo.getQrAuthKey())
            );
            qrInfo.setImageUrl(
                request.getContextPath()
                    + "/admin/store-info/qr/image?businessId="
                    + businessId
                    + "&v="
                    + qrInfo.getQrId()
            );
            return ResponseEntity.ok(qrInfo);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "QR 정보를 불러오지 못했습니다."));
        }
    }

    @GetMapping(value = "/qr/image", produces = MediaType.IMAGE_PNG_VALUE)
    @ResponseBody
    public ResponseEntity<byte[]> getBusinessQrImage(
        @RequestParam int businessId,
        @RequestParam(value = "size", defaultValue = "320") int size,
        HttpServletRequest request) {
        try {
            BusinessQrInfoDTO qrInfo = locationQrService.getOrCreateBusinessQrInfo(businessId);
            String verifyUrl = locationQrService.buildQrVerifyUrl(resolveFrontendBaseUrl(request), qrInfo.getQrAuthKey());
            byte[] qrImage = locationQrService.renderQrImage(verifyUrl, size);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl(CacheControl.noCache().getHeaderValue());
            return new ResponseEntity<>(qrImage, headers, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String resolveFrontendBaseUrl(HttpServletRequest request) {
        String configuredBaseUrl = request.getServletContext().getInitParameter(FRONTEND_BASE_URL_PARAM);
        if (configuredBaseUrl != null && !configuredBaseUrl.trim().isEmpty()) {
            return configuredBaseUrl.trim().replaceAll("/+$", "");
        }

        int frontendPort = request.getServerPort();
        if (frontendPort == 8080) {
            frontendPort = 3000;
        }

        StringBuilder baseUrl = new StringBuilder();
        baseUrl.append(request.getScheme())
            .append("://")
            .append(request.getServerName());

        if (frontendPort != 80 && frontendPort != 443) {
            baseUrl.append(':').append(frontendPort);
        }

        return baseUrl.toString();
    }
}
