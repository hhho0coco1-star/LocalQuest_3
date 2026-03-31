import java.sql.*;
public class DbProbeUsersLite {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         Statement s = c.createStatement();
         ResultSet rs = s.executeQuery("SELECT USER_ID, USER_LOGIN_ID, ROLE, STATUS FROM LQ_USER ORDER BY USER_ID")) {
      while (rs.next()) {
        System.out.println(rs.getInt(1) + " | " + rs.getString(2) + " | " + rs.getString(3) + " | " + rs.getString(4));
      }
    }
  }
}
