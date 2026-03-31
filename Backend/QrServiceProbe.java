import java.io.File;
import java.lang.reflect.Field;

import org.apache.commons.dbcp2.BasicDataSource;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.app.dao.business.impl.BusinessDAOImpl;
import com.app.dao.location.impl.LocationDAOImpl;
import com.app.dao.locationqr.impl.LocationQrDAOImpl;
import com.app.dto.locationqr.BusinessQrInfoDTO;
import com.app.service.business.impl.BusinessServiceImpl;
import com.app.service.location.impl.LocationServiceImpl;
import com.app.service.locationqr.impl.LocationQrServiceImpl;

public class QrServiceProbe {
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

        LocationQrServiceImpl qrService = new LocationQrServiceImpl();
        inject(qrService, "businessService", businessService);
        inject(qrService, "locationService", locationService);
        inject(qrService, "locationQrDAO", locationQrDAO);

        for (int businessId : new int[] {7, 8, 10, 11, 12}) {
            try {
                BusinessQrInfoDTO info = qrService.getOrCreateBusinessQrInfo(businessId);
                String verifyUrl = qrService.buildQrVerifyUrl("http://localhost:3000", info.getQrAuthKey());
                System.out.println("businessId=" + businessId
                    + " | businessName=" + info.getBusinessName()
                    + " | locationId=" + info.getLocationId()
                    + " | locationName=" + info.getLocationName()
                    + " | address=" + info.getAddress()
                    + " | addressDetail=" + info.getAddressDetail()
                    + " | qrId=" + info.getQrId()
                    + " | qrAuthKey=" + info.getQrAuthKey()
                    + " | active=" + info.isActive()
                    + " | verifyUrl=" + verifyUrl);
            } catch (Exception e) {
                System.out.println("businessId=" + businessId + " | ERROR=" + e.getClass().getName() + " | " + e.getMessage());
                e.printStackTrace(System.out);
            }
        }

        ds.close();
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
