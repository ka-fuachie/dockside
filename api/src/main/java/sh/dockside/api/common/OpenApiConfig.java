package sh.dockside.api.common;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

@Configuration
@SecurityScheme(
  name = "bearerAuth",
  type = SecuritySchemeType.HTTP,
  scheme = "bearer",
  bearerFormat = "JWT"
)
@SecurityScheme(
  name = "agentToken",
  type = SecuritySchemeType.APIKEY,
  in = SecuritySchemeIn.HEADER,
  paramName = "X-Agent-Token"
)
public class OpenApiConfig {}
