import java.sql.*;
public class DbProbeBusiness10_11 {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         Statement s = c.createStatement()) {
      String sql = "SELECT BUSINESS_ID, BUSINESS_NAME, LENGTH(BUSINESS_NAME) AS NAME_LEN, ZIP_CODE, LENGTH(ZIP_CODE) AS ZIP_LEN, ADDRESS, LENGTH(ADDRESS) AS ADDR_LEN, ADDRESS_DETAIL, LENGTH(ADDRESS_DETAIL) AS DETAIL_LEN, DESCRIPTION, LENGTH(DESCRIPTION) AS DESC_LEN FROM LQ_BUSINESS WHERE BUSINESS_ID IN (10,11) ORDER BY BUSINESS_ID";
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
