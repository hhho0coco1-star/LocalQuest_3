import java.sql.*;
public class DbProbeStep1 {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         Statement s = c.createStatement()) {
      String sql = "SELECT b.BUSINESS_ID, b.BUSINESS_NAME, l.LOCATION_ID, l.NAME AS LOCATION_NAME, l.LOCATION_TYPE, l.LOCATION_CATEGORY, l.CREATED_AT AS LOCATION_CREATED_AT, q.QR_ID, q.QR_AUTH_KEY, q.IS_ACTIVE, q.CREATED_AT AS QR_CREATED_AT FROM LQ_BUSINESS b LEFT JOIN LQ_LOCATION l ON b.BUSINESS_ID = l.BUSINESS_ID LEFT JOIN LQ_LOCATION_QR q ON l.LOCATION_ID = q.LOCATION_ID WHERE b.BUSINESS_ID IN (7,8,10,11,12) ORDER BY b.BUSINESS_ID, l.CREATED_AT DESC, l.LOCATION_ID DESC, q.QR_ID DESC";
      try (ResultSet rs = s.executeQuery(sql)) {
        ResultSetMetaData md = rs.getMetaData();
        int cols = md.getColumnCount();
        while (rs.next()) {
          StringBuilder row = new StringBuilder();
          for (int i = 1; i <= cols; i++) {
            if (i > 1) row.append(" | ");
            row.append(md.getColumnLabel(i)).append('=').append(rs.getString(i));
          }
          System.out.println(row);
        }
      }
    }
  }
}
