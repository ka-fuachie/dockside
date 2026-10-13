package sh.dockside.api.agent;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AgentTokenFilter extends OncePerRequestFilter {
  private final String expectedToken;

  public AgentTokenFilter(@Value("${agent.token}") String expectedToken) {
    this.expectedToken = expectedToken;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest req,
    HttpServletResponse res,
    FilterChain chain
  ) throws IOException, ServletException {
    var token = req.getHeader("X-Agent-Token");
    if (token == null || !expectedToken.equals(token)) {
      res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "bad agent token");
      return;
    }

    var auth = new UsernamePasswordAuthenticationToken("agent", null,
      List.of(new SimpleGrantedAuthority("ROLE_AGENT"))
    );
    SecurityContextHolder.getContext().setAuthentication(auth);
    chain.doFilter(req, res);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest req) {
    return !req.getServletPath().startsWith("/agent/");
  }
}
