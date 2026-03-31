import java.sql.*;
public class DbProbeUserColumns {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         PreparedStatement ps = c.prepareStatement("SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'LQ_USER' ORDER BY COLUMN_ID");
         ResultSet rs = ps.executeQuery()) {
      while (rs.next()) {
        System.out.println(rs.getString(1) + " | " + rs.getString(2));
      }
    }
  }
}
