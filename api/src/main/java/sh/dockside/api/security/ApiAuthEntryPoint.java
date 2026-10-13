package sh.dockside.api.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import sh.dockside.api.common.ErrorResponse;

@Component
public class ApiAuthEntryPoint implements AuthenticationEntryPoint {
  private final ObjectMapper mapper;

  public ApiAuthEntryPoint(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @Override
  public void commence(
    HttpServletRequest req,
    HttpServletResponse res,
    AuthenticationException ex
  ) throws IOException {
    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
    mapper.writeValue(res.getOutputStream(),
      new ErrorResponse("UNAUTHORIZED", "authentication required", null));
  }
}
