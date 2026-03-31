import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbProbe {
    private static final String URL = "jdbc:oracle:thin:@localhost:1521:orcl";
    private static final String USER = "scott";
    private static final String PASSWORD = "tiger";

    public static void main(String[] args) throws Exception {
        try (Connection connection = DriverManager.getConnection(URL, USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            System.out.println("CONNECTED");

            printQuery(statement,
                "SELECT table_name, column_name " +
                "FROM user_tab_columns " +
                "WHERE table_name IN ('LQ_LOCATION', 'LQ_LOCATION_QR') " +
                "ORDER BY table_name, column_id",
                "TABLE_COLUMNS");

            printQuery(statement,
                "SELECT COUNT(*) AS business_count FROM LQ_BUSINESS",
                "BUSINESS_COUNT");

            printQuery(statement,
                "SELECT COUNT(*) AS location_count FROM LQ_LOCATION",
                "LOCATION_COUNT");

            printQuery(statement,
                "SELECT COUNT(*) AS qr_count FROM LQ_LOCATION_QR",
                "QR_COUNT");

            printQuery(statement,
                "SELECT NVL(TO_CHAR(IS_ACTIVE), 'NULL') AS is_active, COUNT(*) AS cnt " +
                "FROM LQ_LOCATION_QR " +
                "GROUP BY IS_ACTIVE " +
                "ORDER BY is_active",
                "QR_ACTIVE_DISTRIBUTION");

            printQuery(statement,
                "WITH latest_location AS ( " +
                "  SELECT LOCATION_ID, BUSINESS_ID, CREATED_AT, " +
                "         ROW_NUMBER() OVER (PARTITION BY BUSINESS_ID ORDER BY CREATED_AT DESC, LOCATION_ID DESC) AS rn " +
                "  FROM LQ_LOCATION " +
                "), latest_qr AS ( " +
                "  SELECT QR_ID, LOCATION_ID, IS_ACTIVE, CREATED_AT, " +
                "         ROW_NUMBER() OVER (PARTITION BY LOCATION_ID ORDER BY QR_ID DESC) AS rn " +
                "  FROM LQ_LOCATION_QR " +
                ") " +
                "SELECT b.BUSINESS_ID, b.BUSINESS_NAME, ll.LOCATION_ID, lq.QR_ID, NVL(TO_CHAR(lq.IS_ACTIVE), 'NULL') AS IS_ACTIVE " +
                "FROM LQ_BUSINESS b " +
                "LEFT JOIN latest_location ll ON b.BUSINESS_ID = ll.BUSINESS_ID AND ll.rn = 1 " +
                "LEFT JOIN latest_qr lq ON ll.LOCATION_ID = lq.LOCATION_ID AND lq.rn = 1 " +
                "ORDER BY b.BUSINESS_ID",
                "BUSINESS_LOCATION_QR_STATUS");

            printQuery(statement,
                "SELECT QR_ID, LOCATION_ID, NVL(QR_AUTH_KEY, 'NULL') AS QR_AUTH_KEY, NVL(TO_CHAR(IS_ACTIVE), 'NULL') AS IS_ACTIVE " +
                "FROM LQ_LOCATION_QR " +
                "ORDER BY QR_ID",
                "QR_ROWS");

            System.out.println("[LOCATION_MAPPER_COMPAT]");
            try {
                statement.executeQuery(
                    "SELECT LOCATION_ID, BUSINESS_ID, LOCATION_CATEGORY " +
                    "FROM LQ_LOCATION WHERE ROWNUM <= 1"
                ).close();
                System.out.println("LOCATION_CATEGORY query OK");
            } catch (Exception e) {
                System.out.println("LOCATION_CATEGORY query FAILED: " + e.getMessage());
            }
        }
    }

    private static void printQuery(Statement statement, String sql, String title) throws Exception {
        System.out.println("[" + title + "]");
        try (ResultSet resultSet = statement.executeQuery(sql)) {
            int columnCount = resultSet.getMetaData().getColumnCount();
            while (resultSet.next()) {
                StringBuilder row = new StringBuilder();
                for (int i = 1; i <= columnCount; i++) {
                    if (i > 1) {
                        row.append(" | ");
                    }
                    row.append(resultSet.getMetaData().getColumnLabel(i))
                        .append('=')
                        .append(resultSet.getString(i));
                }
                System.out.println(row);
            }
        }
    }
}
