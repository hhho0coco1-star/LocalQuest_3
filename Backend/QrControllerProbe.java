import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.dbcp2.BasicDataSource;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.ResponseEntity;

import com.app.controller.AdminBusinessQrController;
import com.app.dao.business.impl.BusinessDAOImpl;
import com.app.dao.location.impl.LocationDAOImpl;
import com.app.dao.locationqr.impl.LocationQrDAOImpl;
import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.service.business.impl.BusinessServiceImpl;
import com.app.service.location.impl.LocationServiceImpl;
import com.app.service.locationqr.impl.LocationQrServiceImpl;

public class QrControllerProbe {
    public static void main(String[] args) throws Exception {
        BasicDataSource ds = new BasicDataSource();
        ds.setDriverClassName("oracle.jdbc.OracleDriver");
        ds.setUrl("jdbc:oracle:thin:@localhost:1521:orcl");
        ds.setUsername("scott");
        ds.setPassword("tiger");

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] mappers = resolver.getResources("file:C:/study/LocalQuest/Backend/src/main/webapp/WEB-INF/mybatis/mapper/**/*_mapper.xml");
        Resource config = resolver.getResource("file:C:/study/LocalQuest/Backend/src/main/webapp/WEB-INF/mybatis/mybatis-config.xml");

        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(ds);
        factoryBean.setMapperLocations(mappers);
        factoryBean.setConfigLocation(config);
        SqlSessionTemplate template = new SqlSessionTemplate(factoryBean.getObject());

        BusinessDAOImpl businessDAO = new BusinessDAOImpl();
        LocationDAOImpl locationDAO = new LocationDAOImpl();
        LocationQrDAOImpl locationQrDAO = new LocationQrDAOImpl();
        inject(businessDAO, "sqlSessionTemplate", template);
        inject(locationDAO, "sqlSessionTemplate", template);
        inject(locationQrDAO, "sqlSessionTemplate", template);

        BusinessServiceImpl businessService = new BusinessServiceImpl();
        LocationServiceImpl locationService = new LocationServiceImpl();
        inject(businessService, "dao", businessDAO);
        inject(locationService, "dao", locationDAO);

        ServletContext servletContext = createServletContext();

        LocationQrServiceImpl qrService = new LocationQrServiceImpl();
        inject(qrService, "businessService", businessService);
        inject(qrService, "locationService", locationService);
        inject(qrService, "locationQrDAO", locationQrDAO);
        inject(qrService, "servletContext", servletContext);

        AdminBusinessQrController controller = new AdminBusinessQrController();
        inject(controller, "locationQrService", qrService);

        HttpServletRequest request = createRequest(servletContext);

        for (int businessId : new int[] {7, 11, 12}) {
            ResponseEntity<?> qrResponse = controller.getBusinessQr(businessId, request);
            System.out.println("GET /admin/store-info/qr businessId=" + businessId + " status=" + qrResponse.getStatusCodeValue());
            Object body = qrResponse.getBody();
            if (body instanceof BusinessQrInfoDTO) {
                BusinessQrInfoDTO info = (BusinessQrInfoDTO) body;
                System.out.println("  imageUrl=" + info.getImageUrl());
                System.out.println("  verifyUrl=" + info.getVerifyUrl());
                System.out.println("  active=" + info.isActive());
                ResponseEntity<byte[]> imageResponse = controller.getBusinessQrImage(businessId, 320, request);
                byte[] imageBody = imageResponse.getBody();
                System.out.println("  imageStatus=" + imageResponse.getStatusCodeValue());
                System.out.println("  imageBytes=" + (imageBody == null ? 0 : imageBody.length));
                System.out.println("  contentType=" + imageResponse.getHeaders().getContentType());
            } else if (body instanceof Map) {
                System.out.println("  body=" + body);
            } else {
                System.out.println("  bodyType=" + (body == null ? "null" : body.getClass().getName()));
            }
        }

        ds.close();
    }

    private static ServletContext createServletContext() {
        Map<String, String> initParams = new LinkedHashMap<>();
        initParams.put("lq.frontend.base-url", "http://localhost:3000");

        return (ServletContext) Proxy.newProxyInstance(
            QrControllerProbe.class.getClassLoader(),
            new Class<?>[] { ServletContext.class },
            (proxy, method, args) -> {
                if ("getInitParameter".equals(method.getName()) && args != null && args.length == 1) {
                    return initParams.get(String.valueOf(args[0]));
                }
                return defaultValue(method.getReturnType());
            }
        );
    }

    private static HttpServletRequest createRequest(ServletContext servletContext) {
        return (HttpServletRequest) Proxy.newProxyInstance(
            QrControllerProbe.class.getClassLoader(),
            new Class<?>[] { HttpServletRequest.class },
            (proxy, method, args) -> {
                switch (method.getName()) {
                    case "getContextPath":
                        return "";
                    case "getServletContext":
                        return servletContext;
                    case "getServerPort":
                        return 8080;
                    case "getScheme":
                        return "http";
                    case "getServerName":
                        return "localhost";
                    default:
                        return defaultValue(method.getReturnType());
                }
            }
        );
    }

    private static Object defaultValue(Class<?> type) {
        if (type == null || !type.isPrimitive()) {
            return null;
        }
        if (type == boolean.class) {
            return false;
        }
        if (type == byte.class) {
            return (byte) 0;
        }
        if (type == short.class) {
            return (short) 0;
        }
        if (type == int.class) {
            return 0;
        }
        if (type == long.class) {
            return 0L;
        }
        if (type == float.class) {
            return 0F;
        }
        if (type == double.class) {
            return 0D;
        }
        if (type == char.class) {
            return '\0';
        }
        return null;
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
