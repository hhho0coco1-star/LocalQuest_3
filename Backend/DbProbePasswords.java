import java.sql.*;
public class DbProbePasswords {
  public static void main(String[] args) throws Exception {
    try (Connection c = DriverManager.getConnection("jdbc:oracle:thin:@localhost:1521:orcl","scott","tiger");
         Statement s = c.createStatement();
         ResultSet rs = s.executeQuery("SELECT USER_LOGIN_ID, PASSWORD, ROLE FROM LQ_USER ORDER BY USER_ID")) {
      while (rs.next()) {
        String pw = rs.getString(2);
        System.out.println(rs.getString(1) + " | " + rs.getString(3) + " | len=" + (pw == null ? 0 : pw.length()) + " | " + pw);
      }
    }
  }
}
