package sh.dockside.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import sh.dockside.api.agent.AgentTokenFilter;
import sh.dockside.api.auth.JwtAuthFilter;
import sh.dockside.api.user.Role;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  private final JwtAuthFilter jwtAuthFilter;
  private final AgentTokenFilter agentTokenFilter;
  private final ApiAuthEntryPoint entryPoint;
  private final ApiAccessDeniedHandler deniedHandler;

  public SecurityConfig(
    JwtAuthFilter jwtFilter,
    AgentTokenFilter agentTokenFilter,
    ApiAuthEntryPoint entryPoint,
    ApiAccessDeniedHandler deniedHandler
  ) {
    this.jwtAuthFilter = jwtFilter;
    this.agentTokenFilter = agentTokenFilter;
    this.entryPoint = entryPoint;
    this.deniedHandler = deniedHandler;
  }

  @Bean
  PasswordEncoder password() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http
      .csrf(csrf -> csrf.disable())
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .httpBasic(b -> b.disable())
      .authorizeHttpRequests(a -> a
        .requestMatchers("/auth/*", "/actuator/health", "/actuator/prometheus", "/error").permitAll()
        .requestMatchers(HttpMethod.POST, "/sites").hasRole(Role.ADMIN.name())
        .requestMatchers(HttpMethod.POST, "/sites/*/deployments/**").hasAnyRole(
          Role.ADMIN.name(), Role.DEV.name()
        )
        .requestMatchers("/agent/**").hasRole("AGENT")
        .requestMatchers("/users/**").hasRole(Role.ADMIN.name())
        .requestMatchers(HttpMethod.POST, "/deployments/*/rollback").hasAnyRole(Role.ADMIN.name(), Role.DEV.name())
        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
      .addFilterBefore(agentTokenFilter, UsernamePasswordAuthenticationFilter.class)
      .exceptionHandling(e -> e
        .authenticationEntryPoint(entryPoint)
        .accessDeniedHandler(deniedHandler))
      .build();
  }
}
