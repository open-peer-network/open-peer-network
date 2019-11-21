defmodule OPN.Application do
  @moduledoc false
  use Application

  def start(_type, _args) do
    children = [
      # {
      #   Registry,
      #   keys: :unique,
      #   name: Registry.OPN
      # },
      # DeltaCrdt.CausalCrdt,
      OPNWeb.Endpoint,
      OPN.Caylir
    ]

    Supervisor.start_link(children,
      strategy: :one_for_one,
      name: OPN.Supervisor
    )
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    OPNWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
