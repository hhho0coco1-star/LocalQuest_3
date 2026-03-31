package com.app.service.locationqr.impl;

import java.io.ByteArrayOutputStream;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import com.app.dao.locationqr.LocationQrDAO;
import com.app.dto.business.BusinessDTO;
import com.app.dto.location.LocationDTO;
import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.dto.locationqr.LocationQrDTO;
import com.app.service.business.BusinessService;
import com.app.service.location.LocationService;
import com.app.service.locationqr.LocationQrService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;

@Service
public class LocationQrServiceImpl implements LocationQrService {

    private static final String DEFAULT_LOCATION_TYPE = "BUSINESS_STORE";
    private static final String DEFAULT_LOCATION_CATEGORY = "EXPERIENCE";
    private static final int DEFAULT_QR_SIZE = 320;
    private static final int MIN_QR_SIZE = 160;
    private static final int MAX_QR_SIZE = 1024;

    @Autowired
    private BusinessService businessService;

    @Autowired
    private LocationService locationService;

    @Autowired
    private LocationQrDAO locationQrDAO;

    @Override
    @Transactional
    public BusinessQrInfoDTO getOrCreateBusinessQrInfo(int businessId) {
        BusinessDTO business = requireBusiness(businessId);
        if (business == null) {
            throw new NoSuchElementException("매장 정보를 찾을 수 없습니다.");
        }

        LocationDTO representativeLocation = ensureRepresentativeLocation(business);
        LocationQrDTO locationQr = ensureLocationQr(representativeLocation.getLocationId(), false);

        BusinessQrInfoDTO qrInfo = new BusinessQrInfoDTO();
        qrInfo.setBusinessId(business.getBusinessId());
        qrInfo.setBusinessName(business.getBusinessName());
        qrInfo.setLocationId(representativeLocation.getLocationId());
        qrInfo.setLocationName(representativeLocation.getName());
        qrInfo.setZipCode(representativeLocation.getZipCode());
        qrInfo.setAddress(representativeLocation.getAddress());
        qrInfo.setAddressDetail(representativeLocation.getAddressDetail());
        qrInfo.setQrId(locationQr.getQrId());
        qrInfo.setQrAuthKey(locationQr.getQrAuthKey());
        qrInfo.setActive(locationQr.getIsActive() == null || locationQr.getIsActive() == 1);
        return qrInfo;
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessQrInfoDTO getBusinessOperationInfo(int businessId) {
        BusinessDTO business = requireBusiness(businessId);
        return getBusinessQrInfoInternal(business, false, false);
    }

    @Override
    @Transactional
    public BusinessQrInfoDTO suspendBusinessOperation(int businessId) {
        BusinessDTO business = requireBusiness(businessId);
        LocationDTO representativeLocation = ensureRepresentativeLocation(business);
        LocationQrDTO locationQr = ensureLocationQr(representativeLocation.getLocationId(), false);

        if (isQrActive(locationQr)) {
            locationQr.setIsActive(0);
            locationQrDAO.updateLocationQr(locationQr);
        }

        return buildBusinessQrInfo(business, representativeLocation, locationQr);
    }

    @Override
    @Transactional
    public BusinessQrInfoDTO resumeBusinessOperation(int businessId) {
        BusinessDTO business = requireBusiness(businessId);
        return getBusinessQrInfoInternal(business, true, true);
    }

    @Override
    @Transactional
    public byte[] renderQrImage(String qrContent, int size) {
        if (qrContent == null || qrContent.trim().isEmpty()) {
            throw new IllegalArgumentException("QR content is required.");
        }

        int normalizedSize = normalizeQrSize(size);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            BitMatrix bitMatrix = new MultiFormatWriter().encode(
                qrContent.trim(),
                BarcodeFormat.QR_CODE,
                normalizedSize,
                normalizedSize
            );

            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("QR 이미지를 생성하지 못했습니다.", e);
        }
    }

    @Override
    public String buildQrVerifyUrl(String frontendBaseUrl, String qrAuthKey) {
        if (frontendBaseUrl == null || frontendBaseUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Frontend base URL is required.");
        }

        if (qrAuthKey == null || qrAuthKey.trim().isEmpty()) {
            throw new IllegalArgumentException("QR auth key is required.");
        }

        String normalizedBaseUrl = frontendBaseUrl.trim().replaceAll("/+$", "");
        return UriComponentsBuilder.fromHttpUrl(normalizedBaseUrl)
            .path("/qr/verify")
            .queryParam("key", qrAuthKey.trim())
            .build()
            .toUriString();
    }

    private BusinessDTO requireBusiness(int businessId) {
        BusinessDTO business = businessService.getBusinessById(businessId);
        if (business == null) {
            throw new NoSuchElementException("Store information was not found.");
        }
        return business;
    }

    private BusinessQrInfoDTO getBusinessQrInfoInternal(
        BusinessDTO business,
        boolean createMissingResources,
        boolean reactivateInactiveQr) {
        LocationDTO representativeLocation = createMissingResources
            ? ensureRepresentativeLocation(business)
            : locationService.findRepresentativeLocationByBusinessId(business.getBusinessId());

        LocationQrDTO locationQr = null;
        if (representativeLocation != null) {
            locationQr = createMissingResources
                ? ensureLocationQr(representativeLocation.getLocationId(), reactivateInactiveQr)
                : locationQrDAO.findLatestLocationQrByLocationId(representativeLocation.getLocationId());
        }

        return buildBusinessQrInfo(business, representativeLocation, locationQr);
    }

    private BusinessQrInfoDTO buildBusinessQrInfo(
        BusinessDTO business,
        LocationDTO representativeLocation,
        LocationQrDTO locationQr) {
        BusinessQrInfoDTO qrInfo = new BusinessQrInfoDTO();
        qrInfo.setBusinessId(business.getBusinessId());
        qrInfo.setBusinessName(business.getBusinessName());
        qrInfo.setLocationId(representativeLocation != null ? representativeLocation.getLocationId() : 0);
        qrInfo.setLocationName(representativeLocation != null ? representativeLocation.getName() : business.getBusinessName());
        qrInfo.setZipCode(representativeLocation != null ? representativeLocation.getZipCode() : business.getZipCode());
        qrInfo.setAddress(representativeLocation != null ? representativeLocation.getAddress() : business.getAddress());
        qrInfo.setAddressDetail(representativeLocation != null ? representativeLocation.getAddressDetail() : business.getAddressDetail());
        qrInfo.setQrId(locationQr != null ? locationQr.getQrId() : 0);
        qrInfo.setQrAuthKey(locationQr != null ? locationQr.getQrAuthKey() : null);
        qrInfo.setActive(isQrActive(locationQr));
        return qrInfo;
    }

    private LocationDTO ensureRepresentativeLocation(BusinessDTO business) {
        LocationDTO representativeLocation = locationService.findRepresentativeLocationByBusinessId(business.getBusinessId());
        if (representativeLocation == null) {
            LocationDTO newLocation = new LocationDTO();
            newLocation.setBusinessId(business.getBusinessId());
            newLocation.setName(business.getBusinessName());
            newLocation.setZipCode(business.getZipCode());
            newLocation.setAddress(business.getAddress());
            newLocation.setAddressDetail(business.getAddressDetail());
            newLocation.setLatitude(null);
            newLocation.setLongitude(null);
            newLocation.setLocationType(DEFAULT_LOCATION_TYPE);
            newLocation.setLocationCategory(DEFAULT_LOCATION_CATEGORY);
            newLocation.setDescription(business.getDescription());

            locationService.saveLocation(newLocation);
            return newLocation;
        }

        representativeLocation.setBusinessId(business.getBusinessId());
        representativeLocation.setName(business.getBusinessName());
        representativeLocation.setZipCode(business.getZipCode());
        representativeLocation.setAddress(business.getAddress());
        representativeLocation.setAddressDetail(business.getAddressDetail());
        if (representativeLocation.getLocationType() == null || representativeLocation.getLocationType().trim().isEmpty()) {
            representativeLocation.setLocationType(DEFAULT_LOCATION_TYPE);
        }
        representativeLocation.setLocationCategory(DEFAULT_LOCATION_CATEGORY);
        representativeLocation.setDescription(business.getDescription());
        locationService.updateRepresentativeLocation(representativeLocation);
        return representativeLocation;
    }

    private LocationQrDTO ensureLocationQr(int locationId, boolean reactivateInactiveQr) {
        LocationQrDTO existingQr = locationQrDAO.findLatestLocationQrByLocationId(locationId);
        if (existingQr == null) {
            LocationQrDTO newQr = new LocationQrDTO();
            newQr.setLocationId(locationId);
            newQr.setQrAuthKey(generateQrAuthKey());
            newQr.setQrImageUrl(null);
            newQr.setIsActive(1);
            locationQrDAO.saveLocationQr(newQr);
            return newQr;
        }

        boolean needsRefresh = existingQr.getQrAuthKey() == null || existingQr.getQrAuthKey().trim().isEmpty();
        boolean inactive = !isQrActive(existingQr);

        if (needsRefresh) {
            existingQr.setQrAuthKey(generateQrAuthKey());
            existingQr.setQrImageUrl(null);
            locationQrDAO.updateLocationQr(existingQr);
        }

        if (reactivateInactiveQr && inactive) {
            existingQr.setIsActive(1);
            existingQr.setQrImageUrl(null);
            locationQrDAO.updateLocationQr(existingQr);
        }

        return existingQr;
    }

    private boolean isQrActive(LocationQrDTO locationQr) {
        return locationQr == null || locationQr.getIsActive() == null || locationQr.getIsActive() == 1;
    }

    private String generateQrAuthKey() {
        return UUID.randomUUID().toString();
    }

    private int normalizeQrSize(int requestedSize) {
        if (requestedSize <= 0) {
            return DEFAULT_QR_SIZE;
        }
        if (requestedSize < MIN_QR_SIZE) {
            return MIN_QR_SIZE;
        }
        if (requestedSize > MAX_QR_SIZE) {
            return MAX_QR_SIZE;
        }
        return requestedSize;
    }
}
