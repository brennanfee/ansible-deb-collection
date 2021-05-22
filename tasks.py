from invoke import task

"""
To use this script you need to install 'invoke'.  This is best done globally using pip or pipx.

`pipx install invoke`

Afterword, you can execute any of these tasks in the terminal with `inv {task name}`.

For more info:  https://www.pyinvoke.org
"""


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def lint(ctx, scenario="default"):
    ctx.run(f"poetry run molecule lint -s {scenario}")


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def test(ctx, scenario="default"):
    ctx.run(f"poetry run molecule test -s {scenario}")


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def create(ctx, scenario="default"):
    ctx.run(f"poetry run molecule create -s {scenario}")


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def converge(ctx, scenario="default"):
    ctx.run(f"poetry run molecule converge -s {scenario}")


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def login(ctx, scenario="default"):
    ctx.run(f"poetry run molecule login -s {scenario}")


@task(help={"scenario": "The molecule scenario to use.  Default is the default scenario."})
def verify(ctx, scenario="default"):
    ctx.run(f"poetry run molecule verify -s {scenario}")
