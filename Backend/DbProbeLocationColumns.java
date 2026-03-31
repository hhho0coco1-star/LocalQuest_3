import java.sql.*;
public class DbProbeLocationColumns {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         PreparedStatement ps = c.prepareStatement("SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'LQ_LOCATION' ORDER BY COLUMN_ID");
         ResultSet rs = ps.executeQuery()) {
      while (rs.next()) {
        System.out.println(rs.getString(1)+" | "+rs.getString(2)+" | "+rs.getString(3)+" | "+rs.getString(4));
      }
    }
  }
}
