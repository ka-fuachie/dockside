package sh.dockside.api.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class UserSeeder {
  @Bean
  CommandLineRunner seedDemoUsers(
      UserRepository users,
      PasswordEncoder passwords,
      @Value("${seeder.seed-demo-users:false}") boolean shouldSeedDemoUsers) {
    return args -> {
      if (!shouldSeedDemoUsers) return;
      if (users.findByUsername("admin").isPresent()) return;

      User admin = new User();
      admin.setUsername("admin");
      admin.setPasswordHash(passwords.encode("admin123"));
      admin.setRole(Role.ADMIN);

      User dev = new User();
      dev.setUsername("dev");
      dev.setPasswordHash(passwords.encode("dev123"));
      dev.setRole(Role.DEV);

      users.save(admin);
      users.save(dev);
    };
  }

  @Bean
  CommandLineRunner bootstrapAdmin(
      UserRepository users,
      PasswordEncoder passwords,
      @Value("${seeder.prod-admin-user:}") String prodAdminUser,
      @Value("${seeder.prod-admin-password:}") String prodAdminPassword,
      @Value("${seeder.seed-demo-users:false}") boolean shouldSeedDemoUsers) {
    return args -> {
      if(shouldSeedDemoUsers) return;
      if (prodAdminUser.isEmpty() || prodAdminPassword.isEmpty()) return;
      if (users.count() > 0) return;

      User admin = new User();
      admin.setUsername(prodAdminUser);
      admin.setPasswordHash(passwords.encode(prodAdminPassword));
      admin.setRole(Role.ADMIN);
      users.save(admin);
    };
  }
}
