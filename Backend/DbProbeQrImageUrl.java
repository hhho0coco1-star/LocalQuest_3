import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbProbeQrImageUrl {
    private static final String URL = "jdbc:oracle:thin:@localhost:1521:orcl";
    private static final String USER = "scott";
    private static final String PASSWORD = "tiger";

    public static void main(String[] args) throws Exception {
        String sql =
            "SELECT b.BUSINESS_ID, b.BUSINESS_NAME, l.LOCATION_ID, q.QR_ID, " +
            "       NVL(q.QR_AUTH_KEY, 'NULL') AS QR_AUTH_KEY, " +
            "       NVL(q.QR_IMAGE_URL, 'NULL') AS QR_IMAGE_URL, " +
            "       NVL(TO_CHAR(q.IS_ACTIVE), 'NULL') AS IS_ACTIVE " +
            "FROM LQ_BUSINESS b " +
            "LEFT JOIN LQ_LOCATION l ON b.BUSINESS_ID = l.BUSINESS_ID " +
            "LEFT JOIN LQ_LOCATION_QR q ON l.LOCATION_ID = q.LOCATION_ID " +
            "WHERE b.BUSINESS_ID IN (7, 8, 10, 11, 12) " +
            "ORDER BY b.BUSINESS_ID, l.LOCATION_ID, q.QR_ID";

        try (Connection connection = DriverManager.getConnection(URL, USER, PASSWORD);
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                System.out.println(
                    "BUSINESS_ID=" + resultSet.getString("BUSINESS_ID")
                        + " | BUSINESS_NAME=" + resultSet.getString("BUSINESS_NAME")
                        + " | LOCATION_ID=" + resultSet.getString("LOCATION_ID")
                        + " | QR_ID=" + resultSet.getString("QR_ID")
                        + " | QR_AUTH_KEY=" + resultSet.getString("QR_AUTH_KEY")
                        + " | QR_IMAGE_URL=" + resultSet.getString("QR_IMAGE_URL")
                        + " | IS_ACTIVE=" + resultSet.getString("IS_ACTIVE")
                );
            }
        }
    }
}
