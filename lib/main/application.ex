defmodule OPN.Application do
  @moduledoc false
  use Application

  def start(_type, _args) do
    children = [
      OPN.Caylir,
      OPN.Scheduler,
      OPNWeb.Endpoint,
      OPN.Presence
    ]

    # Use cryptographically strong seed for random number generator
    <<i1::unsigned-integer-32, i2::unsigned-integer-32, i3::unsigned-integer-32>> =
      :crypto.strong_rand_bytes(12)

    :rand.seed(:exsplus, {i1, i2, i3})

    :ets.new(:users, [:set, :public, :named_table])
    OPN.Util.initialize_keys()

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
